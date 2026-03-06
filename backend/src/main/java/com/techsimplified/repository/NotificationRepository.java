package com.techsimplified.repository;

import com.techsimplified.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findBySubscriberIdOrderByCreatedAtDesc(UUID subscriberId);
    long countBySubscriberIdAndReadFalse(UUID subscriberId);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.subscriberId = :subscriberId")
    void markAllReadBySubscriberId(UUID subscriberId);

    @Modifying
    @Transactional
    void deleteBySubscriberId(UUID subscriberId);
}
