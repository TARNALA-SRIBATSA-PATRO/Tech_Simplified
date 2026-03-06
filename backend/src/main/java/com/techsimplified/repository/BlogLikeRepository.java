package com.techsimplified.repository;

import com.techsimplified.entity.BlogLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BlogLikeRepository extends JpaRepository<BlogLike, UUID> {
    Optional<BlogLike> findByBlogIdAndSubscriberId(UUID blogId, UUID subscriberId);
    long countByBlogId(UUID blogId);
    boolean existsByBlogIdAndSubscriberId(UUID blogId, UUID subscriberId);
}
