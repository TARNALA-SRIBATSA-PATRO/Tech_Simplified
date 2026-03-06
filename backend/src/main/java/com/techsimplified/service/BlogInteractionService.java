package com.techsimplified.service;

import com.techsimplified.entity.*;
import com.techsimplified.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class BlogInteractionService {

    private final BlogLikeRepository blogLikeRepository;
    private final BlogRepository blogRepository;

    /** Toggle like/unlike. Returns {liked: bool, likeCount: long} */
    @Transactional
    public Map<String, Object> toggleLike(UUID blogId, UUID subscriberId) {
        Optional<BlogLike> existing = blogLikeRepository.findByBlogIdAndSubscriberId(blogId, subscriberId);
        boolean nowLiked;
        if (existing.isPresent()) {
            blogLikeRepository.delete(existing.get());
            nowLiked = false;
        } else {
            BlogLike like = BlogLike.builder()
                    .blogId(blogId)
                    .subscriberId(subscriberId)
                    .build();
            blogLikeRepository.save(like);
            nowLiked = true;
        }
        long likeCount = blogLikeRepository.countByBlogId(blogId);
        return Map.of("liked", nowLiked, "likeCount", likeCount);
    }

    /** Check if subscriber has liked a blog */
    public boolean hasLiked(UUID blogId, UUID subscriberId) {
        return blogLikeRepository.existsByBlogIdAndSubscriberId(blogId, subscriberId);
    }

    /** Increment view count (called once per session from frontend) */
    @Transactional
    public long incrementView(UUID blogId) {
        return blogRepository.findById(blogId).map(blog -> {
            blog.setViewCount(blog.getViewCount() + 1);
            return blogRepository.save(blog).getViewCount();
        }).orElse(0L);
    }

    /** Get blog stats */
    public Map<String, Object> getStats(UUID blogId, UUID subscriberId) {
        long likeCount = blogLikeRepository.countByBlogId(blogId);
        long viewCount = blogRepository.findById(blogId)
                .map(Blog::getViewCount).orElse(0L);
        boolean likedByMe = subscriberId != null && blogLikeRepository.existsByBlogIdAndSubscriberId(blogId, subscriberId);
        return Map.of(
                "likeCount", likeCount,
                "viewCount", viewCount,
                "likedByMe", likedByMe
        );
    }
}
