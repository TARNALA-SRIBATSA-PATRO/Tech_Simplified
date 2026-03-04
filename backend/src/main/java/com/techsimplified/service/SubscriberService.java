package com.techsimplified.service;

import com.techsimplified.entity.MessageLog;
import com.techsimplified.entity.Subscriber;
import com.techsimplified.repository.MessageLogRepository;
import com.techsimplified.repository.SubscriberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriberService {

    private final SubscriberRepository subscriberRepository;
    private final MessageLogRepository messageLogRepository;
    private final EmailService emailService;

    /** Register a new subscriber and send OTP email */
    public String subscribe(String email) {
        if (subscriberRepository.existsByEmail(email)) {
            Subscriber existing = subscriberRepository.findByEmail(email).get();
            if (existing.isVerified()) {
                return "already_verified";
            }
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

    public boolean deleteSubscribers(List<UUID> ids) {
        ids.forEach(id -> {
            if (subscriberRepository.existsById(id)) subscriberRepository.deleteById(id);
        });
        return true;
    }

    /** Send newsletter to a list of specific recipient emails (or all if empty) */
    public void sendNewsletter(String subject, String bodyBlocks, List<String> recipientEmails) {
        List<Subscriber> targets;
        if (recipientEmails == null || recipientEmails.isEmpty()) {
            targets = subscriberRepository.findByVerifiedTrue();
        } else {
            targets = subscriberRepository.findByVerifiedTrue().stream()
                    .filter(s -> recipientEmails.contains(s.getEmail()))
                    .collect(Collectors.toList());
        }

        // Build readable HTML from blocks JSON (frontend sends serialised blocks)
        String htmlBody =
            "<h2 style='margin:0 0 16px;font-size:22px;font-weight:700;color:#f0f0f0;" +
            "font-family:Arial,Helvetica,sans-serif;'>" + subject + "</h2>" +
            "<div style='font-size:15px;color:#cccccc;line-height:1.8;" +
            "font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap;'>" + bodyBlocks + "</div>";

        targets.forEach(sub ->
            emailService.sendHtmlAsync(sub.getEmail(), subject, htmlBody, bodyBlocks)
        );

        // Save message log
        String recipientsStr = targets.stream()
                .map(Subscriber::getEmail)
                .collect(Collectors.joining(","));
        MessageLog log = MessageLog.builder()
                .subject(subject)
                .bodyBlocks(bodyBlocks)
                .recipientCount(targets.size())
                .recipients(recipientsStr)
                .build();
        messageLogRepository.save(log);
    }

    public List<MessageLog> getMessageLogs() {
        return messageLogRepository.findAllByOrderBySentAtDesc();
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private void sendOtp(Subscriber sub) {
        String otp = String.format("%06d", new Random().nextInt(999999));
        sub.setOtp(otp);
        sub.setOtpExpiresAt(Instant.now().plusSeconds(600)); // 10 min
        subscriberRepository.save(sub);

        String htmlBody =
            "<h2 style='margin:0 0 10px;font-size:22px;font-weight:700;color:#f0f0f0;" +
            "font-family:Arial,Helvetica,sans-serif;'>Verify your email</h2>" +
            "<p style='margin:0 0 28px;font-size:15px;color:#aaaaaa;line-height:1.7;" +
            "font-family:Arial,Helvetica,sans-serif;'>" +
            "Enter the code below to complete your subscription to Tech Simplified." +
            "</p>" +
            "<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:12px;'>" +
            "<tr><td align='center' style='background-color:#0d0d0d;border:1px solid #f97316;" +
            "border-radius:10px;padding:24px 16px;'>" +
            "<span style='font-size:40px;font-weight:700;letter-spacing:12px;color:#f97316;" +
            "font-family:Courier New,Courier,monospace;user-select:all;'>" + otp + "</span>" +
            "</td></tr>" +
            "</table>" +
            "<p style='margin:0 0 24px;font-size:12px;color:#555555;text-align:center;" +
            "font-family:Arial,Helvetica,sans-serif;'>Tap the code to select it, then copy</p>" +
            "<p style='margin:0;font-size:13px;color:#777777;line-height:1.6;" +
            "font-family:Arial,Helvetica,sans-serif;'>" +
            "This code expires in <strong style='color:#aaaaaa;'>10 minutes</strong>. " +
            "If you didn't request this, you can safely ignore this email.</p>";

        emailService.sendHtmlAsync(
            sub.getEmail(),
            "Tech Simplified — Verify Your Email",
            htmlBody,
            "Your verification OTP is: " + otp + "\n\nExpires in 10 minutes."
        );
    }
}
