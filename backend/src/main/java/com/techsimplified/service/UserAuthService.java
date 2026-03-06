package com.techsimplified.service;

import com.techsimplified.entity.Subscriber;
import com.techsimplified.repository.SubscriberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

/**
 * Handles subscriber (user) OTP login, profile setup, and profile updates.
 * Subscribers authenticate via email OTP — same mechanism as subscription verification.
 */
@Service
@RequiredArgsConstructor
public class UserAuthService {

    private final SubscriberRepository subscriberRepository;
    private final EmailService emailService;
    private final JwtService jwtService;

    /**
     * Send OTP to subscriber for login.
     * Only verified subscribers can log in.
     * Returns: "otp_sent" | "not_subscribed" | "not_verified"
     */
    public String sendLoginOtp(String email) {
        Optional<Subscriber> opt = subscriberRepository.findByEmail(email);
        if (opt.isEmpty()) return "not_subscribed";
        Subscriber sub = opt.get();
        if (!sub.isVerified()) return "not_verified";

        String otp = String.format("%06d", new Random().nextInt(999999));
        sub.setOtp(otp);
        sub.setOtpExpiresAt(Instant.now().plusSeconds(600));
        subscriberRepository.save(sub);

        String htmlBody =
            "<h2 style='margin:0 0 10px;font-size:22px;font-weight:700;color:#f0f0f0;" +
            "font-family:Arial,Helvetica,sans-serif;'>Your login code</h2>" +
            "<p style='margin:0 0 28px;font-size:15px;color:#aaaaaa;line-height:1.7;" +
            "font-family:Arial,Helvetica,sans-serif;'>" +
            "Use the code below to log in to your Tech Simplified account." +
            "</p>" +
            "<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:12px;'>" +
            "<tr><td align='center' style='background-color:#0d0d0d;border:1px solid #f97316;" +
            "border-radius:10px;padding:24px 16px;'>" +
            "<span style='font-size:40px;font-weight:700;letter-spacing:12px;color:#f97316;" +
            "font-family:Courier New,Courier,monospace;user-select:all;'>" + otp + "</span>" +
            "</td></tr></table>" +
            "<p style='margin:0 0 24px;font-size:12px;color:#555555;text-align:center;" +
            "font-family:Arial,Helvetica,sans-serif;'>Tap the code to select it, then copy</p>" +
            "<p style='margin:0;font-size:13px;color:#777777;line-height:1.6;" +
            "font-family:Arial,Helvetica,sans-serif;'>" +
            "This code expires in <strong style='color:#aaaaaa;'>10 minutes</strong>. " +
            "If you didn't request this, you can safely ignore this email.</p>";

        emailService.sendHtmlAsync(
            sub.getEmail(),
            "Tech Simplified — Your Login Code",
            htmlBody,
            "Your login OTP is: " + otp + "\n\nExpires in 10 minutes."
        );

        return "otp_sent";
    }

    /**
     * Verify OTP and return a JWT token for the subscriber.
     * Returns null if verification fails.
     */
    public String verifyLoginOtp(String email, String otp) {
        Optional<Subscriber> opt = subscriberRepository.findByEmail(email);
        if (opt.isEmpty()) return null;

        Subscriber sub = opt.get();
        if (sub.getOtp() == null) return null;
        if (!sub.getOtp().equals(otp)) return null;
        if (Instant.now().isAfter(sub.getOtpExpiresAt())) return null;

        // Clear OTP
        sub.setOtp(null);
        sub.setOtpExpiresAt(null);
        subscriberRepository.save(sub);

        // Token subject = "USER:<subscriberId>"
        return jwtService.generateToken("USER:" + sub.getId());
    }

    /** Update display name for subscriber */
    public Subscriber updateProfile(UUID subscriberId, String displayName) {
        Subscriber sub = subscriberRepository.findById(subscriberId)
                .orElseThrow(() -> new RuntimeException("Subscriber not found"));
        if (displayName != null && !displayName.isBlank()) {
            sub.setDisplayName(displayName.trim());
        }
        sub.setProfileSetupComplete(true);
        return subscriberRepository.save(sub);
    }

    /** Update profile photo (base64 string) */
    public Subscriber updateProfilePhoto(UUID subscriberId, String base64Photo) {
        Subscriber sub = subscriberRepository.findById(subscriberId)
                .orElseThrow(() -> new RuntimeException("Subscriber not found"));
        sub.setProfilePhotoBase64(base64Photo);
        return subscriberRepository.save(sub);
    }

    /** Skip profile setup — use email prefix as display name */
    public Subscriber skipProfileSetup(UUID subscriberId) {
        Subscriber sub = subscriberRepository.findById(subscriberId)
                .orElseThrow(() -> new RuntimeException("Subscriber not found"));
        if (sub.getDisplayName() == null || sub.getDisplayName().isBlank()) {
            String emailPrefix = sub.getEmail().split("@")[0];
            sub.setDisplayName(emailPrefix);
        }
        sub.setProfileSetupComplete(true);
        return subscriberRepository.save(sub);
    }

    public Optional<Subscriber> findById(UUID id) {
        return subscriberRepository.findById(id);
    }

    /** Extract subscriber UUID from JWT subject "USER:<uuid>" */
    public UUID extractSubscriberIdFromToken(String token) {
        String subject = jwtService.extractSubject(token);
        if (subject == null || !subject.startsWith("USER:")) return null;
        try {
            return UUID.fromString(subject.substring(5));
        } catch (Exception e) {
            return null;
        }
    }

    /** Helper to get subscriber from Authorization header */
    public Optional<Subscriber> getSubscriberFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return Optional.empty();
        String token = authHeader.substring(7);
        if (!jwtService.isTokenValid(token)) return Optional.empty();
        UUID id = extractSubscriberIdFromToken(token);
        if (id == null) return Optional.empty();
        return subscriberRepository.findById(id);
    }
}
