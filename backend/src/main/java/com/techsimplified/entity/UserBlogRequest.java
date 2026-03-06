package com.techsimplified.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_blog_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBlogRequest {

    public enum Status { PENDING, APPROVED, REJECTED }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** The subscriber who submitted this blog */
    @Column(name = "subscriber_id", nullable = false)
    private UUID subscriberId;

    @Column(nullable = false)
    private String title;

    /** JSON string of ContentBlock[] — same as Blog.content */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private Instant submittedAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    /** UUID of the Blog record created when approved (null until approved) */
    @Column(name = "published_blog_id")
    private UUID publishedBlogId;

    @PrePersist
    protected void onCreate() {
        submittedAt = Instant.now();
    }
}
