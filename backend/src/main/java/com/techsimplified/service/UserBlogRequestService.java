package com.techsimplified.service;

import com.techsimplified.entity.*;
import com.techsimplified.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class UserBlogRequestService {

    private final UserBlogRequestRepository requestRepository;
    private final BlogRepository blogRepository;
    private final SubscriberRepository subscriberRepository;
    private final NotificationRepository notificationRepository;
    private final BlogCommentRepository commentRepository;

    /** Submit a new blog request from a subscriber */
    public UserBlogRequest submit(UUID subscriberId, String title, String content) {
        UserBlogRequest req = UserBlogRequest.builder()
                .subscriberId(subscriberId)
                .title(title)
                .content(content)
                .build();
        return requestRepository.save(req);
    }

    /** Get all submissions for a subscriber (with enriched data) */
    public List<Map<String, Object>> getBySubscriber(UUID subscriberId) {
        List<UserBlogRequest> requests = requestRepository.findBySubscriberIdOrderBySubmittedAtDesc(subscriberId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (UserBlogRequest r : requests) {
            Map<String, Object> map = toMap(r);
            // If approved, add comment count
            if (r.getPublishedBlogId() != null) {
                long commentCount = commentRepository.countByBlogIdAndDeletedFalse(r.getPublishedBlogId());
                map.put("commentCount", commentCount);
            } else {
                map.put("commentCount", 0L);
            }
            result.add(map);
        }
        return result;
    }

    /** Admin: get all submissions enriched with author info */
    public List<Map<String, Object>> getAllRequests() {
        List<UserBlogRequest> requests = requestRepository.findAllByOrderBySubmittedAtDesc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (UserBlogRequest r : requests) {
            Map<String, Object> map = toMap(r);
            subscriberRepository.findById(r.getSubscriberId()).ifPresent(sub -> {
                map.put("authorName", sub.getDisplayName() != null ? sub.getDisplayName() : sub.getEmail().split("@")[0]);
                map.put("authorEmail", sub.getEmail());
                map.put("authorPhoto", sub.getProfilePhotoBase64());
            });
            result.add(map);
        }
        return result;
    }

    /** Admin: approve — creates a Blog record and notifies subscriber */
    @Transactional
    public Map<String, Object> approve(UUID requestId, boolean notifyAll, List<String> excludeEmails) {
        UserBlogRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (req.getStatus() != UserBlogRequest.Status.PENDING) {
            throw new RuntimeException("Request is not in PENDING state");
        }

        // Create the published blog
        Blog blog = Blog.builder()
                .title(req.getTitle())
                .content(req.getContent())
                .authorSubscriberId(req.getSubscriberId())
                .build();
        Blog savedBlog = blogRepository.save(blog);

        // Update request
        req.setStatus(UserBlogRequest.Status.APPROVED);
        req.setReviewedAt(Instant.now());
        req.setPublishedBlogId(savedBlog.getId());
        requestRepository.save(req);

        // Send notification to subscriber
        String blogTitle = req.getTitle();
        UUID savedBlogId = savedBlog.getId();
        subscriberRepository.findById(req.getSubscriberId()).ifPresent(sub -> {
            Notification notif = Notification.builder()
                    .subscriberId(sub.getId())
                    .type(Notification.Type.BLOG_PUBLISHED)
                    .message("Your blog '" + blogTitle + "' has been approved and published!")
                    .relatedBlogId(savedBlogId)
                    .build();
            notificationRepository.save(notif);
        });

        return Map.of("blogId", savedBlog.getId(), "requestId", requestId);
    }

    /** Admin: reject — notifies subscriber */
    @Transactional
    public void reject(UUID requestId) {
        UserBlogRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        req.setStatus(UserBlogRequest.Status.REJECTED);
        req.setReviewedAt(Instant.now());
        requestRepository.save(req);

        // Send rejection notification
        String blogTitle = req.getTitle();
        subscriberRepository.findById(req.getSubscriberId()).ifPresent(sub -> {
            Notification notif = Notification.builder()
                    .subscriberId(sub.getId())
                    .type(Notification.Type.BLOG_REJECTED)
                    .message("Your blog '" + blogTitle + "' was not approved at this time. You may update and resubmit.")
                    .build();
            notificationRepository.save(notif);
        });
    }

    /** Subscriber: update own pending submission */
    public Optional<UserBlogRequest> update(UUID requestId, UUID subscriberId, String title, String content) {
        return requestRepository.findById(requestId).map(req -> {
            if (!req.getSubscriberId().equals(subscriberId)) return null;
            if (req.getStatus() != UserBlogRequest.Status.PENDING) return null;
            req.setTitle(title);
            req.setContent(content);
            return requestRepository.save(req);
        });
    }

    /** Subscriber: delete own submission */
    public boolean delete(UUID requestId, UUID subscriberId) {
        return requestRepository.findById(requestId).map(req -> {
            if (!req.getSubscriberId().equals(subscriberId)) return false;
            requestRepository.delete(req);
            return true;
        }).orElse(false);
    }

    private Map<String, Object> toMap(UserBlogRequest r) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", r.getId());
        map.put("title", r.getTitle());
        map.put("content", r.getContent());
        map.put("status", r.getStatus());
        map.put("submittedAt", r.getSubmittedAt());
        map.put("reviewedAt", r.getReviewedAt());
        map.put("publishedBlogId", r.getPublishedBlogId());
        return map;
    }
}
