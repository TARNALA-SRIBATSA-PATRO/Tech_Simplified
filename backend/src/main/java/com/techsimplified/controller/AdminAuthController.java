package com.techsimplified.controller;

import com.techsimplified.service.JwtService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminAuthController {

    private final JwtService jwtService;
    private final JavaMailSender mailSender;

    @Value("${admin.email}")
    private String adminEmail;

    /** In-memory OTP store: otp -> expiry. Single-admin app so this is fine. */
    private static final ConcurrentHashMap<String, Instant> OTP_STORE = new ConcurrentHashMap<>();

    // ── POST /api/admin/otp  — send OTP to admin email ────────────────────────
    @PostMapping("/otp")
    public ResponseEntity<Map<String, String>> sendOtp() {
        String otp = String.format("%06d", new Random().nextInt(999999));
        OTP_STORE.clear(); // Only one valid OTP at a time
        OTP_STORE.put(otp, Instant.now().plusSeconds(300)); // expires in 5 min

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(adminEmail);
        msg.setSubject("Tech Simplified — Admin Login OTP");
        msg.setText(
            "Your admin login OTP is: " + otp +
            "\n\nThis code expires in 5 minutes.\n\nIf you did not request this, ignore this email."
        );
        mailSender.send(msg);

        return ResponseEntity.ok(Map.of("message", "OTP sent to admin email"));
    }

    // ── POST /api/admin/login  — verify OTP and return JWT ────────────────────
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> verifyOtp(@RequestBody OtpRequest req) {
        String otp = req.getOtp();

        Instant expiry = OTP_STORE.get(otp);
        if (expiry == null || Instant.now().isAfter(expiry)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or expired OTP"));
        }

        OTP_STORE.remove(otp); // one-time use
        String token = jwtService.generateToken("admin");
        return ResponseEntity.ok(Map.of("token", token, "message", "Login successful"));
    }

    @Data
    static class OtpRequest {
        private String otp;
    }
}
