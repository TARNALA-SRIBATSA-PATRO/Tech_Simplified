package com.techsimplified.service;

import com.techsimplified.dto.BlogRequest;
import com.techsimplified.entity.Blog;
import com.techsimplified.repository.BlogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BlogService {

    private final BlogRepository blogRepository;

    public List<Blog> getAllBlogs() {
        return blogRepository.findAllByOrderByCreatedAtDesc();
    }

    public Optional<Blog> getBlogById(UUID id) {
        return blogRepository.findById(id);
    }

    public Blog createBlog(BlogRequest request) {
        Blog blog = Blog.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .build();
        return blogRepository.save(blog);
    }

    public Optional<Blog> updateBlog(UUID id, BlogRequest request) {
        return blogRepository.findById(id).map(existing -> {
            existing.setTitle(request.getTitle());
            existing.setContent(request.getContent());
            return blogRepository.save(existing);
        });
    }

    public boolean deleteBlog(UUID id) {
        if (blogRepository.existsById(id)) {
            blogRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
