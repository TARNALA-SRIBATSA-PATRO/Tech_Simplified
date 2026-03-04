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

    /** Send a plain-text email asynchronously. */
    public void sendAsync(String to, String subject, String text) {
        String html = "<p style='color:#e0e0e0;font-size:15px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;margin:0;'>" + text + "</p>";
        sendHtmlAsync(to, subject, html, text);
    }

    /** Send a branded HTML email asynchronously. */
    public void sendHtmlAsync(String to, String subject, String htmlBody, String textFallback) {
        CompletableFuture.runAsync(() -> {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("api-key", apiKey);

                Map<String, Object> body = Map.of(
                    "sender",      Map.of("name", "Tech Simplified", "email", senderEmail),
                    "to",          List.of(Map.of("email", to)),
                    "subject",     subject,
                    "htmlContent", buildHtmlEmail(subject, htmlBody),
                    "textContent", textFallback
                );

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
                restTemplate.postForObject(BREVO_API_URL, request, String.class);
                System.out.println("[Email] Sent to: " + to);
            } catch (Exception e) {
                System.err.println("[Email] Failed to " + to + ": " + e.getMessage());
            }
        });
    }

    /**
     * Wraps any HTML body content in the branded Tech Simplified email shell.
     * Uses solid colours only — gradient clip-text breaks in most email clients.
     */
    private String buildHtmlEmail(String subject, String bodyHtml) {
        return "<!DOCTYPE html>" +
            "<html lang='en'><head>" +
            "<meta charset='UTF-8'/>" +
            "<meta name='viewport' content='width=device-width,initial-scale=1'/>" +
            "<title>" + subject + "</title>" +
            "</head>" +
            "<body style='margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,Helvetica,sans-serif;'>" +
            "<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color:#0a0a0a;padding:40px 16px;'>" +
            "<tr><td align='center'>" +
            "<table width='560' cellpadding='0' cellspacing='0' border='0' style='max-width:560px;width:100%;'>" +

            // ── Header: plain "Tech Simplified" in solid orange — works everywhere ──
            "<tr><td align='center' style='padding-bottom:24px;'>" +
            "<span style='font-size:24px;font-weight:700;color:#f97316;" +
            "font-family:Arial,Helvetica,sans-serif;letter-spacing:-0.3px;'>Tech Simplified</span>" +
            "</td></tr>" +

            // ── Card body ─────────────────────────────────────────────────────
            "<tr><td style='background-color:#141414;border:1px solid #2d2d2d;border-radius:12px;padding:36px 40px;'>" +
            bodyHtml +
            "</td></tr>" +

            // ── Footer ────────────────────────────────────────────────────────
            "<tr><td align='center' style='padding-top:24px;'>" +
            "<p style='margin:0;font-size:12px;color:#555555;line-height:1.7;font-family:Arial,Helvetica,sans-serif;'>" +
            "You received this because you subscribed to Tech Simplified.<br/>" +
            "&copy; 2025 Tech Simplified &nbsp;&middot;&nbsp; Made with &#10084; by Sribatsa" +
            "</p>" +
            "</td></tr>" +

            "</table>" +
            "</td></tr>" +
            "</table>" +
            "</body></html>";
    }
}
