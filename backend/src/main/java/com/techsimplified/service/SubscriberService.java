package com.techsimplified.service;

import com.techsimplified.entity.Subscriber;
import com.techsimplified.repository.SubscriberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class SubscriberService {

    private final SubscriberRepository subscriberRepository;
    private final JavaMailSender mailSender;

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

    /** Send a newsletter message to all verified subscribers (async) */
    public void sendNewsletter(String subject, String body) {
        List<Subscriber> verified = subscriberRepository.findByVerifiedTrue();
        verified.forEach(sub -> CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setTo(sub.getEmail());
                msg.setSubject(subject);
                msg.setText(body);
                mailSender.send(msg);
            } catch (Exception e) {
                System.err.println("Newsletter send failed for " + sub.getEmail() + ": " + e.getMessage());
            }
        }));
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private void sendOtp(Subscriber sub) {
        String otp = String.format("%06d", new Random().nextInt(999999));
        sub.setOtp(otp);
        sub.setOtpExpiresAt(Instant.now().plusSeconds(600)); // 10 min
        subscriberRepository.save(sub); // Save synchronously before returning

        // Send email in background so the HTTP response is immediate
        final String emailTo = sub.getEmail();
        final String otpCode = otp;
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setTo(emailTo);
                msg.setSubject("Tech Simplified — Verify Your Email");
                msg.setText("Your verification OTP is: " + otpCode + "\n\nThis code expires in 10 minutes.");
                mailSender.send(msg);
                System.out.println("Subscriber OTP email sent to: " + emailTo);
            } catch (Exception e) {
                System.err.println("Subscriber OTP email failed: " + e.getClass().getSimpleName() + " — " + e.getMessage());
            }
        });
    }
}
