package com.techsimplified.controller;

import com.techsimplified.entity.Notification;
import com.techsimplified.repository.NotificationRepository;
import com.techsimplified.service.UserAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/user/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserAuthService userAuthService;

    /** GET /api/user/notifications — get all notifications for current user */
    @GetMapping
    public ResponseEntity<?> getNotifications(@RequestHeader("Authorization") String authHeader) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> {
                    List<Notification> notifs = notificationRepository.findBySubscriberIdOrderByCreatedAtDesc(sub.getId());
                    long unreadCount = notificationRepository.countBySubscriberIdAndReadFalse(sub.getId());
                    List<Map<String, Object>> list = new ArrayList<>();
                    for (Notification n : notifs) {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("id", n.getId());
                        m.put("type", n.getType());
                        m.put("message", n.getMessage());
                        m.put("relatedBlogId", n.getRelatedBlogId());
                        m.put("relatedCommentId", n.getRelatedCommentId());
                        m.put("read", n.isRead());
                        m.put("createdAt", n.getCreatedAt());
                        list.add(m);
                    }
                    return ResponseEntity.ok(Map.of("notifications", list, "unreadCount", unreadCount));
                })
                .orElse(ResponseEntity.status(401).build());
    }

    /** GET /api/user/notifications/count — get unread count only */
    @GetMapping("/count")
    public ResponseEntity<?> getUnreadCount(@RequestHeader("Authorization") String authHeader) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> ResponseEntity.ok(Map.of(
                        "unreadCount", notificationRepository.countBySubscriberIdAndReadFalse(sub.getId())
                )))
                .orElse(ResponseEntity.status(401).build());
    }

    /** PATCH /api/user/notifications/{id}/read — mark single notification as read */
    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(
            @PathVariable UUID id,
            @RequestHeader("Authorization") String authHeader) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> notificationRepository.findById(id)
                        .filter(n -> n.getSubscriberId().equals(sub.getId()))
                        .map(n -> {
                            n.setRead(true);
                            notificationRepository.save(n);
                            return ResponseEntity.<Void>noContent().build();
                        })
                        .orElse(ResponseEntity.<Void>notFound().build()))
                .orElse(ResponseEntity.<Void>status(401).build());
    }

    /** PATCH /api/user/notifications/read-all — mark all as read */
    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllRead(@RequestHeader("Authorization") String authHeader) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> {
                    notificationRepository.markAllReadBySubscriberId(sub.getId());
                    return ResponseEntity.<Void>noContent().build();
                })
                .orElse(ResponseEntity.<Void>status(401).build());
    }

    /** DELETE /api/user/notifications/{id} — delete single notification */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOne(
            @PathVariable UUID id,
            @RequestHeader("Authorization") String authHeader) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> notificationRepository.findById(id)
                        .filter(n -> n.getSubscriberId().equals(sub.getId()))
                        .map(n -> {
                            notificationRepository.delete(n);
                            return ResponseEntity.<Void>noContent().build();
                        })
                        .orElse(ResponseEntity.<Void>notFound().build()))
                .orElse(ResponseEntity.<Void>status(401).build());
    }

    /** DELETE /api/user/notifications — delete all notifications for user */
    @DeleteMapping
    public ResponseEntity<?> deleteAll(@RequestHeader("Authorization") String authHeader) {
        return userAuthService.getSubscriberFromHeader(authHeader)
                .map(sub -> {
                    notificationRepository.deleteBySubscriberId(sub.getId());
                    return ResponseEntity.<Void>noContent().build();
                })
                .orElse(ResponseEntity.<Void>status(401).build());
    }
}
