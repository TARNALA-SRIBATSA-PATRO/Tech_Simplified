package com.techsimplified.repository;

import com.techsimplified.entity.HelpMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface HelpMessageRepository extends JpaRepository<HelpMessage, UUID> {
}
