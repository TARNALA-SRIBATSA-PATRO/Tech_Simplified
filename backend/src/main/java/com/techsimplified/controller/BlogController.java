package com.techsimplified.controller;

import com.techsimplified.dto.BlogRequest;
import com.techsimplified.entity.Blog;
import com.techsimplified.service.BlogService;
import com.techsimplified.service.SubscriberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/blogs")
@RequiredArgsConstructor
public class BlogController {

    private final BlogService blogService;
    private final SubscriberService subscriberService;

    @Value("${frontend.url:http://localhost:8081}")
    private String frontendUrl;

    /** GET /api/blogs — public */
    @GetMapping
    public List<Blog> getAllBlogs() {
        return blogService.getAllBlogs();
    }

    /** GET /api/blogs/{id} — public */
    @GetMapping("/{id}")
    public ResponseEntity<Blog> getBlog(@PathVariable UUID id) {
        return blogService.getBlogById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** POST /api/blogs — admin only; triggers subscriber email notifications */
    @PostMapping
    public ResponseEntity<Blog> createBlog(@Valid @RequestBody BlogRequest request) {
        Blog blog = blogService.createBlog(request);

        // Send notification to all verified subscribers
        String blogUrl = frontendUrl + "/blog/" + blog.getId();
        String subject = "New Post: " + blog.getTitle();
        String body =
            "Hey there!\n\n" +
            "A new blog post has been published on Tech Simplified:\n\n" +
            "\"" + blog.getTitle() + "\"\n\n" +
            "Read it here: " + blogUrl + "\n\n" +
            "---\n" +
            "Tech Simplified by Sribatsa\n" +
            "To unsubscribe, reply to this email.";

        try {
            subscriberService.sendNewsletter(subject, body);
        } catch (Exception e) {
            // Don't fail blog creation if email fails
            System.err.println("Newsletter send failed: " + e.getMessage());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(blog);
    }

    /** PUT /api/blogs/{id} — admin only */
    @PutMapping("/{id}")
    public ResponseEntity<Blog> updateBlog(@PathVariable UUID id,
                                           @Valid @RequestBody BlogRequest request) {
        return blogService.updateBlog(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** DELETE /api/blogs/{id} — admin only */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBlog(@PathVariable UUID id) {
        return blogService.deleteBlog(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
