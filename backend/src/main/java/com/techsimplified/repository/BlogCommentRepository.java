package com.techsimplified.repository;

import com.techsimplified.entity.BlogComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BlogCommentRepository extends JpaRepository<BlogComment, UUID> {
    List<BlogComment> findByBlogIdAndParentCommentIdIsNullAndDeletedFalseOrderByCreatedAtAsc(UUID blogId);
    List<BlogComment> findByParentCommentIdAndDeletedFalseOrderByCreatedAtAsc(UUID parentCommentId);
    long countByBlogIdAndDeletedFalse(UUID blogId);
}
