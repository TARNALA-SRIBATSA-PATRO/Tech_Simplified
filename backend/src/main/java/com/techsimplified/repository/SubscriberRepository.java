package com.techsimplified.repository;

import com.techsimplified.entity.Subscriber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriberRepository extends JpaRepository<Subscriber, UUID> {
    Optional<Subscriber> findByEmail(String email);
    List<Subscriber> findByVerifiedTrue();
    boolean existsByEmail(String email);
}
