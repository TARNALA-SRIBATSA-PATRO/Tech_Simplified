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
        sendHtmlAsync(to, subject, "<p style='color:#f0f0f0;font-family:Inter,sans-serif'>" + text + "</p>", text);
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
     * Matches the website's dark (#0a0a0a) + orange (#f97316) design.
     */
    private String buildHtmlEmail(String subject, String bodyHtml) {
        return "<!DOCTYPE html>" +
            "<html lang='en'><head>" +
            "<meta charset='UTF-8'/>" +
            "<meta name='viewport' content='width=device-width,initial-scale=1'/>" +
            "<title>" + subject + "</title>" +
            "<link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' rel='stylesheet'/>" +
            "</head>" +
            "<body style='margin:0;padding:0;background:#0a0a0a;font-family:Inter,system-ui,sans-serif;'>" +
            "  <table width='100%' cellpadding='0' cellspacing='0' style='background:#0a0a0a;padding:40px 16px;'>" +
            "    <tr><td align='center'>" +
            "      <table width='100%' cellpadding='0' cellspacing='0' style='max-width:580px;'>" +

            // ── Header ──────────────────────────────────────────────────────
            "        <tr><td style='padding-bottom:28px;text-align:center;'>" +
            "          <table cellpadding='0' cellspacing='0' style='display:inline-table;'>" +
            "            <tr><td>" +
            "              <div style='display:inline-flex;align-items:center;gap:10px;'>" +
            "                <div style='width:38px;height:38px;border-radius:8px;background:#141414;border:1px solid #2d2d2d;" +
            "                            display:flex;align-items:center;justify-content:center;text-align:center;" +
            "                            line-height:38px;font-size:15px;font-weight:700;color:#f97316;letter-spacing:-0.5px;'>TS</div>" +
            "                <span style='font-size:20px;font-weight:700;background:linear-gradient(90deg,#f97316,#fb923c);" +
            "                             -webkit-background-clip:text;-webkit-text-fill-color:transparent;'>Tech Simplified</span>" +
            "              </div>" +
            "            </td></tr>" +
            "          </table>" +
            "        </td></tr>" +

            // ── Card body ────────────────────────────────────────────────────
            "        <tr><td style='background:#141414;border:1px solid #2d2d2d;border-radius:14px;padding:32px 36px;'>" +
            "          " + bodyHtml +
            "        </td></tr>" +

            // ── Footer ───────────────────────────────────────────────────────
            "        <tr><td style='padding-top:24px;text-align:center;'>" +
            "          <p style='margin:0;font-size:12px;color:#555555;line-height:1.6;'>" +
            "            You received this email because you subscribed to Tech Simplified.<br/>" +
            "            &copy; 2025 Tech Simplified &nbsp;|&nbsp; Made with ♥ by Sribatsa" +
            "          </p>" +
            "        </td></tr>" +

            "      </table>" +
            "    </td></tr>" +
            "  </table>" +
            "</body></html>";
    }
}
