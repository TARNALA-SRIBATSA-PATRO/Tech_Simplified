package com.techsimplified.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscribers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Subscriber {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "is_verified", nullable = false)
    private boolean verified = false;

    @Column(name = "subscribed_at", nullable = false, updatable = false)
    private Instant subscribedAt;

    /** One-time password for email verification */
    @Column(name = "otp")
    private String otp;

    @Column(name = "otp_expires_at")
    private Instant otpExpiresAt;

    @PrePersist
    protected void onCreate() {
        subscribedAt = Instant.now();
    }
}
