package com.techsimplified.repository;

import com.techsimplified.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CommentLikeRepository extends JpaRepository<CommentLike, UUID> {
    Optional<CommentLike> findByCommentIdAndSubscriberId(UUID commentId, UUID subscriberId);
    boolean existsByCommentIdAndSubscriberId(UUID commentId, UUID subscriberId);
}
