package com.example.demo.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;


@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class BlogRequest {
    private String title;
    private String content;
    private String img;
}
