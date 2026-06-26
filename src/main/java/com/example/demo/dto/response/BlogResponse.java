package com.example.demo.dto.response;

import com.example.demo.entity.Blog;
import com.example.demo.enums.BlogStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class BlogResponse {
    private Long id;
    private String title;
    private String content;
    private String author;
    private String img;
    private BlogStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
