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

    // ── Profile fields ────────────────────────────────────────────────────────

    /** User-chosen display name; defaults to email prefix if skipped */
    @Column(name = "display_name")
    private String displayName;

    /**
     * Profile photo stored as base64-encoded string.
     * Compressed client-side to ≤200 KB. Formats: JPEG, PNG, WebP.
     */
    @Column(name = "profile_photo_base64", columnDefinition = "TEXT")
    private String profilePhotoBase64;

    /** True once the user has completed (or deliberately skipped) profile setup */
    @Column(name = "profile_setup_complete", nullable = false)
    @Builder.Default
    private boolean profileSetupComplete = false;

    @PrePersist
    protected void onCreate() {
        subscribedAt = Instant.now();
    }
}
