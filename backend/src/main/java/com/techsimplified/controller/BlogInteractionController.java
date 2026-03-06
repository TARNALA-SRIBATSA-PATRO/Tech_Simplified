package com.techsimplified.controller;

import com.techsimplified.service.BlogInteractionService;
import com.techsimplified.service.UserAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/blogs/{blogId}")
@RequiredArgsConstructor
public class BlogInteractionController {

    private final BlogInteractionService interactionService;
    private final UserAuthService userAuthService;

    /** POST /api/blogs/{blogId}/like — toggle like (auth required) */
    @PostMapping("/like")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable UUID blogId,
            @RequestHeader("Authorization") String authHeader) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> ResponseEntity.ok(interactionService.toggleLike(blogId, sub.getId())))
                .orElse(ResponseEntity.status(401).build());
    }

    /** POST /api/blogs/{blogId}/view — increment view count (public, called once per session) */
    @PostMapping("/view")
    public ResponseEntity<Map<String, Long>> incrementView(@PathVariable UUID blogId) {
        long viewCount = interactionService.incrementView(blogId);
        return ResponseEntity.ok(Map.of("viewCount", viewCount));
    }

    /** GET /api/blogs/{blogId}/stats — get like count, view count, and whether current user liked */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @PathVariable UUID blogId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        UUID userId = authHeader != null
                ? userAuthService.getSubscriberFromHeader(authHeader).map(s -> s.getId()).orElse(null)
                : null;
        return ResponseEntity.ok(interactionService.getStats(blogId, userId));
    }
}
