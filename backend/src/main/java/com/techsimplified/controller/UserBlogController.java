package com.techsimplified.controller;

import com.techsimplified.service.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserBlogController {

    private final UserBlogRequestService requestService;
    private final UserAuthService userAuthService;

    // ── Subscriber-facing ──────────────────────────────────────────────────────

    /** POST /api/user/blogs — submit a new blog */
    @PostMapping("/user/blogs")
    public ResponseEntity<?> submit(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody BlogSubmitRequest req) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> ResponseEntity.ok(requestService.submit(sub.getId(), req.getTitle(), req.getContent())))
                .orElse(ResponseEntity.status(401).build());
    }

    /** GET /api/user/blogs — list my submissions */
    @GetMapping("/user/blogs")
    public ResponseEntity<?> listMyBlogs(@RequestHeader("Authorization") String authHeader) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> ResponseEntity.ok(requestService.getBySubscriber(sub.getId())))
                .orElse(ResponseEntity.status(401).build());
    }

    /** PUT /api/user/blogs/{id} — edit a pending submission */
    @PutMapping("/user/blogs/{id}")
    public ResponseEntity<?> update(
            @PathVariable UUID id,
            @RequestHeader("Authorization") String authHeader,
            @RequestBody BlogSubmitRequest req) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> {
                    var updated = requestService.update(id, sub.getId(), req.getTitle(), req.getContent());
                    return updated != null
                            ? ResponseEntity.ok(updated)
                            : ResponseEntity.status(403).<Object>build();
                })
                .orElse(ResponseEntity.status(401).build());
    }

    /** DELETE /api/user/blogs/{id} — delete own submission */
    @DeleteMapping("/user/blogs/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @RequestHeader("Authorization") String authHeader) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> requestService.delete(id, sub.getId())
                        ? ResponseEntity.<Void>noContent().build()
                        : ResponseEntity.<Void>status(403).build())
                .orElse(ResponseEntity.<Void>status(401).build());
    }

    // ── Admin-facing ──────────────────────────────────────────────────────────

    /** GET /api/admin/requests — get all blog submissions (admin) */
    @GetMapping("/admin/requests")
    public ResponseEntity<List<Map<String, Object>>> getAllRequests() {
        return ResponseEntity.ok(requestService.getAllRequests());
    }

    /** POST /api/admin/requests/{id}/approve — approve and publish */
    @PostMapping("/admin/requests/{id}/approve")
    public ResponseEntity<?> approve(
            @PathVariable UUID id,
            @RequestBody(required = false) ApproveRequest req) {
        boolean notifyAll = req == null || req.isNotifyAll();
        Map<String, Object> result = requestService.approve(id, notifyAll, List.of());
        return ResponseEntity.ok(result);
    }

    /** POST /api/admin/requests/{id}/reject — reject submission */
    @PostMapping("/admin/requests/{id}/reject")
    public ResponseEntity<Void> reject(@PathVariable UUID id) {
        requestService.reject(id);
        return ResponseEntity.noContent().build();
    }

    // ── Inner DTOs ─────────────────────────────────────────────────────────────
    @Data static class BlogSubmitRequest { private String title; private String content; }
    @Data static class ApproveRequest { private boolean notifyAll = true; }
}
