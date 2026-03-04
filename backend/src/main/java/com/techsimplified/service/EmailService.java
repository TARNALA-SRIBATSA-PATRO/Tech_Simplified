package com.techsimplified.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * HTTP-based email service using Brevo API (300 emails/day free).
 * Uses Spring's RestTemplate — no extra SDK dependency needed.
 * Replaces JavaMailSender/SMTP which is blocked on Render's free tier.
 */
@Service
public class EmailService {

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    @Value("${brevo.api-key}")
    private String apiKey;

    @Value("${brevo.sender-email}")
    private String senderEmail;

    private final RestTemplate restTemplate = new RestTemplate();

    /** Send email asynchronously — HTTP response is always immediate. */
    public void sendAsync(String to, String subject, String text) {
        CompletableFuture.runAsync(() -> {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("api-key", apiKey);

                Map<String, Object> body = Map.of(
                    "sender",      Map.of("name", "Tech Simplified", "email", senderEmail),
                    "to",          List.of(Map.of("email", to)),
                    "subject",     subject,
                    "textContent", text
                );

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
                restTemplate.postForObject(BREVO_API_URL, request, String.class);
                System.out.println("[Email] Sent to: " + to);
            } catch (Exception e) {
                System.err.println("[Email] Failed to " + to + ": " + e.getMessage());
            }
        });
    }
}
