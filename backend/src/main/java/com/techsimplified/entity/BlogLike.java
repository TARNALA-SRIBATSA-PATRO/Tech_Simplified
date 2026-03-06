package com.techsimplified.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "blog_likes",
    uniqueConstraints = @UniqueConstraint(columnNames = {"blog_id", "subscriber_id"})
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogLike {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "blog_id", nullable = false)
    private UUID blogId;

    @Column(name = "subscriber_id", nullable = false)
    private UUID subscriberId;

    @Column(name = "liked_at", nullable = false, updatable = false)
    private Instant likedAt;

    @PrePersist
    protected void onCreate() {
        likedAt = Instant.now();
    }
}
