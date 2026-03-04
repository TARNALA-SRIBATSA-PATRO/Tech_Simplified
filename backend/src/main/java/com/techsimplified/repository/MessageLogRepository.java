package com.techsimplified.repository;

import com.techsimplified.entity.MessageLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageLogRepository extends JpaRepository<MessageLog, UUID> {
    List<MessageLog> findAllByOrderBySentAtDesc();
}
