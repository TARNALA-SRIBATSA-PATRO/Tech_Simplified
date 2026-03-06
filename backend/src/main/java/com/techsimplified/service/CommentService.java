package com.techsimplified.service;

import com.techsimplified.entity.*;
import com.techsimplified.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final BlogCommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final NotificationRepository notificationRepository;
    private final BlogRepository blogRepository;
    private final SubscriberRepository subscriberRepository;

    /** Get all top-level comments for a blog, each with their replies */
    public List<Map<String, Object>> getCommentsForBlog(UUID blogId, UUID currentUserId) {
        List<BlogComment> topLevel = commentRepository
                .findByBlogIdAndParentCommentIdIsNullAndDeletedFalseOrderByCreatedAtAsc(blogId);

        List<Map<String, Object>> result = new ArrayList<>();
        for (BlogComment c : topLevel) {
            result.add(toCommentMap(c, currentUserId, true));
        }
        return result;
    }

    private Map<String, Object> toCommentMap(BlogComment c, UUID currentUserId, boolean includeReplies) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", c.getId());
        map.put("blogId", c.getBlogId());
        map.put("subscriberId", c.getSubscriberId());
        map.put("content", c.getContent());
        map.put("likeCount", c.getLikeCount());
        map.put("createdAt", c.getCreatedAt());
        map.put("parentCommentId", c.getParentCommentId());

        // Author info
        subscriberRepository.findById(c.getSubscriberId()).ifPresent(sub -> {
            map.put("authorName", sub.getDisplayName() != null ? sub.getDisplayName() : sub.getEmail().split("@")[0]);
            map.put("authorPhoto", sub.getProfilePhotoBase64());
        });

        // Whether current user liked this comment
        if (currentUserId != null) {
            map.put("likedByMe", commentLikeRepository.existsByCommentIdAndSubscriberId(c.getId(), currentUserId));
        } else {
            map.put("likedByMe", false);
        }

        // Add replies
        if (includeReplies) {
            List<BlogComment> replies = commentRepository
                    .findByParentCommentIdAndDeletedFalseOrderByCreatedAtAsc(c.getId());
            List<Map<String, Object>> replyMaps = new ArrayList<>();
            for (BlogComment r : replies) {
                replyMaps.add(toCommentMap(r, currentUserId, false));
            }
            map.put("replies", replyMaps);
        }

        return map;
    }

    /** Add a top-level comment */
    @Transactional
    public BlogComment addComment(UUID blogId, UUID subscriberId, String content) {
        BlogComment comment = BlogComment.builder()
                .blogId(blogId)
                .subscriberId(subscriberId)
                .content(content)
                .build();
        BlogComment saved = commentRepository.save(comment);

        // Notify the blog author (if it's not the same person)
        blogRepository.findById(blogId).ifPresent(blog -> {
            UUID authorId = blog.getAuthorSubscriberId();
            if (authorId != null && !authorId.equals(subscriberId)) {
                String commenterName = subscriberRepository.findById(subscriberId)
                        .map(s -> s.getDisplayName() != null ? s.getDisplayName() : s.getEmail().split("@")[0])
                        .orElse("Someone");
                Notification notif = Notification.builder()
                        .subscriberId(authorId)
                        .type(Notification.Type.COMMENT_ON_BLOG)
                        .message(commenterName + " commented on your blog: "" + blog.getTitle() + """)
                        .relatedBlogId(blogId)
                        .relatedCommentId(saved.getId())
                        .build();
                notificationRepository.save(notif);
            }
        });

        return saved;
    }

    /** Reply to a comment */
    @Transactional
    public BlogComment replyToComment(UUID blogId, UUID parentCommentId, UUID subscriberId, String content) {
        BlogComment reply = BlogComment.builder()
                .blogId(blogId)
                .subscriberId(subscriberId)
                .parentCommentId(parentCommentId)
                .content(content)
                .build();
        BlogComment saved = commentRepository.save(reply);

        // Notify the parent comment author
        commentRepository.findById(parentCommentId).ifPresent(parent -> {
            if (!parent.getSubscriberId().equals(subscriberId)) {
                String replierName = subscriberRepository.findById(subscriberId)
                        .map(s -> s.getDisplayName() != null ? s.getDisplayName() : s.getEmail().split("@")[0])
                        .orElse("Someone");
                Notification notif = Notification.builder()
                        .subscriberId(parent.getSubscriberId())
                        .type(Notification.Type.REPLY_TO_COMMENT)
                        .message(replierName + " replied to your comment")
                        .relatedBlogId(blogId)
                        .relatedCommentId(saved.getId())
                        .build();
                notificationRepository.save(notif);
            }
        });

        return saved;
    }

    /** Soft-delete a comment (only owner can delete) */
    @Transactional
    public boolean deleteComment(UUID commentId, UUID subscriberId) {
        return commentRepository.findById(commentId).map(c -> {
            if (!c.getSubscriberId().equals(subscriberId)) return false;
            c.setDeleted(true);
            commentRepository.save(c);
            return true;
        }).orElse(false);
    }

    /** Toggle like on a comment */
    @Transactional
    public Map<String, Object> toggleCommentLike(UUID commentId, UUID subscriberId) {
        Optional<CommentLike> existing = commentLikeRepository.findByCommentIdAndSubscriberId(commentId, subscriberId);
        boolean nowLiked;
        if (existing.isPresent()) {
            commentLikeRepository.delete(existing.get());
            nowLiked = false;
        } else {
            CommentLike like = CommentLike.builder()
                    .commentId(commentId)
                    .subscriberId(subscriberId)
                    .build();
            commentLikeRepository.save(like);
            nowLiked = true;
        }
        // Update like count on comment
        commentRepository.findById(commentId).ifPresent(c -> {
            long count = commentLikeRepository.findByCommentIdAndSubscriberId(commentId, subscriberId).isPresent()
                    ? c.getLikeCount() + (nowLiked ? 0 : -1)
                    : c.getLikeCount() + (nowLiked ? 1 : 0);
            // Simpler: recount via query-like approach
            c.setLikeCount(nowLiked ? c.getLikeCount() + 1 : Math.max(0, c.getLikeCount() - 1));
            commentRepository.save(c);
        });
        BlogComment updated = commentRepository.findById(commentId).orElse(null);
        return Map.of("liked", nowLiked, "likeCount", updated != null ? updated.getLikeCount() : 0);
    }
}
