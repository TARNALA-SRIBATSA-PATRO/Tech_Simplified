package com.techsimplified.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "comment_likes",
    uniqueConstraints = @UniqueConstraint(columnNames = {"comment_id", "subscriber_id"})
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentLike {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "comment_id", nullable = false)
    private UUID commentId;

    @Column(name = "subscriber_id", nullable = false)
    private UUID subscriberId;

    @Column(name = "liked_at", nullable = false, updatable = false)
    private Instant likedAt;

    @PrePersist
    protected void onCreate() {
        likedAt = Instant.now();
    }
}
