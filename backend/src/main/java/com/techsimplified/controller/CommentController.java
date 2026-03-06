package com.techsimplified.controller;

import com.techsimplified.entity.BlogComment;
import com.techsimplified.service.CommentService;
import com.techsimplified.service.UserAuthService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/blogs/{blogId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final UserAuthService userAuthService;

    /** GET /api/blogs/{blogId}/comments — public, but enriched if user is logged in */
    @GetMapping
    public List<Map<String, Object>> getComments(
            @PathVariable UUID blogId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        UUID userId = getUserId(authHeader);
        return commentService.getCommentsForBlog(blogId, userId);
    }

    /** POST /api/blogs/{blogId}/comments — add top-level comment (auth required) */
    @PostMapping
    public ResponseEntity<?> addComment(
            @PathVariable UUID blogId,
            @RequestHeader("Authorization") String authHeader,
            @RequestBody CommentRequest req) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> {
                    BlogComment comment = commentService.addComment(blogId, sub.getId(), req.getContent());
                    return ResponseEntity.ok(Map.of(
                            "id", comment.getId(),
                            "content", comment.getContent(),
                            "createdAt", comment.getCreatedAt()
                    ));
                })
                .orElse(ResponseEntity.status(401).build());
    }

    /** POST /api/blogs/{blogId}/comments/{commentId}/reply — reply to a comment */
    @PostMapping("/{commentId}/reply")
    public ResponseEntity<?> addReply(
            @PathVariable UUID blogId,
            @PathVariable UUID commentId,
            @RequestHeader("Authorization") String authHeader,
            @RequestBody CommentRequest req) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> {
                    BlogComment reply = commentService.replyToComment(blogId, commentId, sub.getId(), req.getContent());
                    return ResponseEntity.ok(Map.of(
                            "id", reply.getId(),
                            "content", reply.getContent(),
                            "createdAt", reply.getCreatedAt()
                    ));
                })
                .orElse(ResponseEntity.status(401).build());
    }

    /** DELETE /api/blogs/{blogId}/comments/{commentId} — soft-delete (own comment only) */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID blogId,
            @PathVariable UUID commentId,
            @RequestHeader("Authorization") String authHeader) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> commentService.deleteComment(commentId, sub.getId())
                        ? ResponseEntity.<Void>noContent().build()
                        : ResponseEntity.<Void>status(403).build())
                .orElse(ResponseEntity.<Void>status(401).build());
    }

    /** POST /api/blogs/{blogId}/comments/{commentId}/like — toggle comment like */
    @PostMapping("/{commentId}/like")
    public ResponseEntity<Map<String, Object>> likeComment(
            @PathVariable UUID blogId,
            @PathVariable UUID commentId,
            @RequestHeader("Authorization") String authHeader) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> ResponseEntity.ok(commentService.toggleCommentLike(commentId, sub.getId())))
                .orElse(ResponseEntity.status(401).build());
    }

    // ── Helpers ────────────────────────────────────────────────────────────────
    private UUID getUserId(String authHeader) {
        if (authHeader == null) return null;
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(s -> s.getId()).orElse(null);
    }

    @Data static class CommentRequest { private String content; }
}
