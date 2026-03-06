package com.techsimplified.controller;

import com.techsimplified.entity.Subscriber;
import com.techsimplified.service.UserAuthService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserAuthController {

    private final UserAuthService userAuthService;

    /** POST /api/user/otp — send login OTP to subscriber email */
    @PostMapping("/otp")
    public ResponseEntity<Map<String, String>> sendOtp(@RequestBody EmailRequest req) {
        String result = userAuthService.sendLoginOtp(req.getEmail());
        return switch (result) {
            case "not_subscribed" -> ResponseEntity.badRequest()
                    .body(Map.of("status", "not_subscribed", "message", "This email is not subscribed. Please subscribe first."));
            case "not_verified" -> ResponseEntity.badRequest()
                    .body(Map.of("status", "not_verified", "message", "Please verify your subscription email first."));
            default -> ResponseEntity.ok(Map.of("status", "otp_sent", "message", "OTP sent to your email."));
        };
    }

    /** POST /api/user/login — verify OTP and get JWT token */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody OtpRequest req) {
        String token = userAuthService.verifyLoginOtp(req.getEmail(), req.getOtp());
        if (token == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP"));
        }
        // Return token + subscriber profile
        return userAuthService.getSubscriberFromHeader("Bearer " + token)
                .map(sub -> ResponseEntity.ok(Map.<String, Object>of(
                        "token", token,
                        "id", sub.getId(),
                        "email", sub.getEmail(),
                        "displayName", sub.getDisplayName() != null ? sub.getDisplayName() : sub.getEmail().split("@")[0],
                        "profilePhotoBase64", sub.getProfilePhotoBase64() != null ? sub.getProfilePhotoBase64() : "",
                        "profileSetupComplete", sub.isProfileSetupComplete()
                )))
                .orElse(ResponseEntity.internalServerError().body(Map.of("error", "Failed to load profile")));
    }

    /** GET /api/user/profile — get current user's profile */
    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@RequestHeader("Authorization") String authHeader) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> ResponseEntity.ok(toProfileMap(sub)))
                .orElse(ResponseEntity.status(401).body(Map.of("error", "Unauthorized")));
    }

    /** PUT /api/user/profile — update display name */
    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ProfileUpdateRequest req) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> {
                    Subscriber updated = userAuthService.updateProfile(sub.getId(), req.getDisplayName());
                    return ResponseEntity.ok(toProfileMap(updated));
                })
                .orElse(ResponseEntity.status(401).body(Map.of("error", "Unauthorized")));
    }

    /** PUT /api/user/profile/photo — update profile photo */
    @PutMapping("/profile/photo")
    public ResponseEntity<Map<String, Object>> updatePhoto(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody PhotoRequest req) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> {
                    Subscriber updated = userAuthService.updateProfilePhoto(sub.getId(), req.getBase64Photo());
                    return ResponseEntity.ok(toProfileMap(updated));
                })
                .orElse(ResponseEntity.status(401).body(Map.of("error", "Unauthorized")));
    }

    /** POST /api/user/profile/skip — skip profile setup */
    @PostMapping("/profile/skip")
    public ResponseEntity<Map<String, Object>> skipSetup(@RequestHeader("Authorization") String authHeader) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> {
                    Subscriber updated = userAuthService.skipProfileSetup(sub.getId());
                    return ResponseEntity.ok(toProfileMap(updated));
                })
                .orElse(ResponseEntity.status(401).body(Map.of("error", "Unauthorized")));
    }

    // ── Inner DTO classes ──────────────────────────────────────────────────────

    @Data static class EmailRequest { private String email; }
    @Data static class OtpRequest { private String email; private String otp; }
    @Data static class ProfileUpdateRequest { private String displayName; }
    @Data static class PhotoRequest { private String base64Photo; }

    private Map<String, Object> toProfileMap(Subscriber sub) {
        return Map.of(
                "id", sub.getId(),
                "email", sub.getEmail(),
                "displayName", sub.getDisplayName() != null ? sub.getDisplayName() : sub.getEmail().split("@")[0],
                "profilePhotoBase64", sub.getProfilePhotoBase64() != null ? sub.getProfilePhotoBase64() : "",
                "profileSetupComplete", sub.isProfileSetupComplete()
        );
    }
}
