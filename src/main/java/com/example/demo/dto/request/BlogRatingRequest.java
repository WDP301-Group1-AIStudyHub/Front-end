package com.example.demo.dto.request;

import lombok.Data;

@Data
public class BlogRatingRequest {
    private int rating;
    private String comment;
}
