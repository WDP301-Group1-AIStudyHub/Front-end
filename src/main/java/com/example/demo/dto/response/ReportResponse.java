package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportResponse {
    private Long id;
    private String title;
    private String description;
    private String type;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
}
