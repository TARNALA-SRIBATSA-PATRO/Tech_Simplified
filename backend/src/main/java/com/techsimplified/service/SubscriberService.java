package com.techsimplified.service;

import com.techsimplified.entity.Subscriber;
import com.techsimplified.repository.SubscriberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubscriberService {

    private final SubscriberRepository subscriberRepository;
    private final EmailService emailService;

    /** Register a new subscriber and send OTP email */
    public String subscribe(String email) {
        if (subscriberRepository.existsByEmail(email)) {
            Subscriber existing = subscriberRepository.findByEmail(email).get();
            if (existing.isVerified()) {
                return "already_verified";
            }
            // Resend OTP
            sendOtp(existing);
            return "otp_resent";
        }

        Subscriber sub = Subscriber.builder()
                .email(email)
                .verified(false)
                .build();
        sendOtp(sub);
        return "otp_sent";
    }

    /** Verify OTP and mark subscriber as verified */
    public boolean verifyOtp(String email, String otp) {
        Optional<Subscriber> opt = subscriberRepository.findByEmail(email);
        if (opt.isEmpty()) return false;

        Subscriber sub = opt.get();
        if (sub.getOtp() == null) return false;
        if (!sub.getOtp().equals(otp)) return false;
        if (Instant.now().isAfter(sub.getOtpExpiresAt())) return false;

        sub.setVerified(true);
        sub.setOtp(null);
        sub.setOtpExpiresAt(null);
        subscriberRepository.save(sub);
        return true;
    }

    public List<Subscriber> getVerifiedSubscribers() {
        return subscriberRepository.findByVerifiedTrue();
    }

    public List<Subscriber> getAllSubscribers() {
        return subscriberRepository.findAll();
    }

    public boolean deleteSubscriber(UUID id) {
        if (subscriberRepository.existsById(id)) {
            subscriberRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /** Send newsletter to all verified subscribers (async per subscriber) */
    public void sendNewsletter(String subject, String body) {
        List<Subscriber> verified = subscriberRepository.findByVerifiedTrue();

        String htmlBody =
            "<h2 style='margin:0 0 16px;font-size:22px;font-weight:700;color:#f0f0f0;'>" + subject + "</h2>" +
            "<div style='font-size:15px;color:#cccccc;line-height:1.8;white-space:pre-wrap;'>" + body + "</div>";

        verified.forEach(sub ->
            emailService.sendHtmlAsync(sub.getEmail(), subject, htmlBody, body)
        );
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private void sendOtp(Subscriber sub) {
        String otp = String.format("%06d", new Random().nextInt(999999));
        sub.setOtp(otp);
        sub.setOtpExpiresAt(Instant.now().plusSeconds(600)); // 10 min
        subscriberRepository.save(sub); // Save synchronously

        String htmlBody =
            "<h2 style='margin:0 0 8px;font-size:22px;font-weight:700;color:#f0f0f0;'>Verify your email</h2>" +
            "<p style='margin:0 0 24px;font-size:15px;color:#888888;line-height:1.6;'>" +
            "  Enter the code below to complete your subscription to Tech Simplified." +
            "</p>" +
            "<div style='background:#0a0a0a;border:1px solid #f97316;border-radius:10px;padding:20px 24px;" +
            "            text-align:center;margin-bottom:24px;'>" +
            "  <span style='font-size:36px;font-weight:700;letter-spacing:10px;color:#f97316;'>" + otp + "</span>" +
            "</div>" +
            "<p style='margin:0;font-size:13px;color:#666666;'>This code expires in <strong style='color:#888888;'>10 minutes</strong>. " +
            "If you didn't request this, you can safely ignore this email.</p>";

        String textFallback = "Your Tech Simplified verification OTP is: " + otp + "\n\nThis code expires in 10 minutes.";

        emailService.sendHtmlAsync(
            sub.getEmail(),
            "Tech Simplified — Verify Your Email",
            htmlBody,
            textFallback
        );
    }
}
