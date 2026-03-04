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
        verified.forEach(sub ->
            emailService.sendAsync(sub.getEmail(), subject, body)
        );
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private void sendOtp(Subscriber sub) {
        String otp = String.format("%06d", new Random().nextInt(999999));
        sub.setOtp(otp);
        sub.setOtpExpiresAt(Instant.now().plusSeconds(600)); // 10 min
        subscriberRepository.save(sub); // Save synchronously

        emailService.sendAsync(
            sub.getEmail(),
            "Tech Simplified — Verify Your Email",
            "Your verification OTP is: " + otp + "\n\nThis code expires in 10 minutes."
        );
    }
}
