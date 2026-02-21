package com.techsimplified.controller;

import com.techsimplified.dto.SubscriberRequest;
import com.techsimplified.entity.Subscriber;
import com.techsimplified.service.SubscriberService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscribers")
@RequiredArgsConstructor
public class SubscriberController {

    private final SubscriberService subscriberService;

    /** POST /api/subscribers/subscribe — public */
    @PostMapping("/subscribe")
    public ResponseEntity<Map<String, String>> subscribe(@Valid @RequestBody SubscriberRequest req) {
        String result = subscriberService.subscribe(req.getEmail());
        return ResponseEntity.ok(Map.of("status", result));
    }

    /** POST /api/subscribers/verify — public */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verify(@RequestBody OtpVerifyRequest req) {
        boolean success = subscriberService.verifyOtp(req.getEmail(), req.getOtp());
        return ResponseEntity.ok(Map.of("verified", success));
    }

    /** GET /api/subscribers — admin only */
    @GetMapping
    public List<Subscriber> getAllSubscribers() {
        return subscriberService.getAllSubscribers();
    }

    /** DELETE /api/subscribers/{id} — admin only */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubscriber(@PathVariable UUID id) {
        return subscriberService.deleteSubscriber(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    /** POST /api/subscribers/newsletter — admin only */
    @PostMapping("/newsletter")
    public ResponseEntity<Map<String, String>> sendNewsletter(@RequestBody NewsletterRequest req) {
        subscriberService.sendNewsletter(req.getSubject(), req.getBody());
        return ResponseEntity.ok(Map.of("status", "sent"));
    }

    // ── Inner DTOs ─────────────────────────────────────────────────────────────

    @Data
    static class OtpVerifyRequest {
        private String email;
        private String otp;
    }

    @Data
    static class NewsletterRequest {
        private String subject;
        private String body;
    }
}
