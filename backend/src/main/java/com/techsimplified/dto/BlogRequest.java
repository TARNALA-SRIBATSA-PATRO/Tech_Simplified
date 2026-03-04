package com.techsimplified.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BlogRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content; // JSON string of ContentBlock[]

    private Boolean notifySubscribers = true; // default: notify
}
