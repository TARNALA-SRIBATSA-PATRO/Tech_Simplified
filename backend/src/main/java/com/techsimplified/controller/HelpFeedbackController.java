package com.techsimplified.controller;

import com.techsimplified.entity.HelpMessage;
import com.techsimplified.repository.HelpMessageRepository;
import com.techsimplified.service.EmailService;
import com.techsimplified.service.UserAuthService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user/help")
@RequiredArgsConstructor
public class HelpFeedbackController {

    private final HelpMessageRepository helpMessageRepository;
    private final UserAuthService userAuthService;
    private final EmailService emailService;

    @Value("${admin.email:tsribatsapatro@gmail.com}")
    private String adminEmail;

    /** POST /api/user/help — submit a help/feedback message */
    @PostMapping
    public ResponseEntity<Map<String, String>> sendHelp(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody HelpRequest req) {

        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> {
                    // Save to DB
                    HelpMessage msg = HelpMessage.builder()
                            .subscriberId(sub.getId())
                            .displayName(sub.getDisplayName() != null
                                    ? sub.getDisplayName()
                                    : sub.getEmail().split("@")[0])
                            .email(sub.getEmail())
                            .message(req.getMessage())
                            .build();
                    helpMessageRepository.save(msg);

                    // Email admin
                    String displayName = sub.getDisplayName() != null
                            ? sub.getDisplayName()
                            : sub.getEmail().split("@")[0];
                    String htmlBody =
                        "<h2 style='margin:0 0 10px;font-size:20px;font-weight:700;color:#f0f0f0;" +
                        "font-family:Arial,sans-serif;'>Help & Feedback</h2>" +
                        "<p style='margin:0 0 8px;font-size:14px;color:#aaaaaa;font-family:Arial,sans-serif;'>" +
                        "<strong>From:</strong> " + displayName + " (" + sub.getEmail() + ")</p>" +
                        "<p style='margin:0 0 16px;font-size:15px;color:#cccccc;font-family:Arial,sans-serif;" +
                        "white-space:pre-wrap;line-height:1.7;'>" + req.getMessage() + "</p>";

                    emailService.sendHtmlAsync(
                        adminEmail,
                        "Help & Feedback from " + displayName,
                        htmlBody,
                        "From: " + displayName + " (" + sub.getEmail() + ")\n\n" + req.getMessage()
                    );

                    return ResponseEntity.ok(Map.of("status", "sent"));
                })
                .orElse(ResponseEntity.status(401).body(Map.of("error", "Unauthorized")));
    }

    @Data static class HelpRequest { private String message; }
}
