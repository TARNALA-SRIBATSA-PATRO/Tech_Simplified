package com.techsimplified.repository;

import com.techsimplified.entity.UserBlogRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserBlogRequestRepository extends JpaRepository<UserBlogRequest, UUID> {
    List<UserBlogRequest> findBySubscriberIdOrderBySubmittedAtDesc(UUID subscriberId);
    List<UserBlogRequest> findAllByOrderBySubmittedAtDesc();
    List<UserBlogRequest> findByStatusOrderBySubmittedAtDesc(UserBlogRequest.Status status);
}
