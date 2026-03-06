package com.techsimplified.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    public enum Type {
        COMMENT_ON_BLOG,   // someone commented on subscriber's blog
        REPLY_TO_COMMENT,  // someone replied to subscriber's comment
        BLOG_APPROVED,     // admin approved subscriber's submitted blog
        BLOG_REJECTED,     // admin rejected subscriber's submitted blog
        BLOG_PUBLISHED     // admin published subscriber's blog (approved + published)
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** The subscriber who should receive this notification */
    @Column(name = "subscriber_id", nullable = false)
    private UUID subscriberId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "related_blog_id")
    private UUID relatedBlogId;

    @Column(name = "related_comment_id")
    private UUID relatedCommentId;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean read = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
