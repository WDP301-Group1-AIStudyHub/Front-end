package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BlogRatingResponse {
    private Long id;
    private Long blogId;
    private Long userId;
    private String userName;
    private int rating;
    private String comment;
}
