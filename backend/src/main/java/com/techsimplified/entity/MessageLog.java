package com.techsimplified.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "message_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String subject;

    /** Serialised JSON of ContentBlock[] — same format as blog content */
    @Column(name = "body_blocks", columnDefinition = "TEXT", nullable = false)
    private String bodyBlocks;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private Instant sentAt;

    @Column(name = "recipient_count", nullable = false)
    private int recipientCount;

    /** Comma-separated list of recipient emails */
    @Column(name = "recipients", columnDefinition = "TEXT")
    private String recipients;

    @PrePersist
    protected void onCreate() {
        sentAt = Instant.now();
    }
}
