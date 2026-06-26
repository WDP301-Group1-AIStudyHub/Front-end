package com.example.demo.entity;

import com.example.demo.enums.BlogStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
@Entity
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@Getter
@Setter
public class Blog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    String title;

    @Lob
    String img; // ảnh bài viết (link hoặc base64)

    @Column(columnDefinition = "TEXT")
    String content;

    String author;

    @Column(name = "user_id") // <--- Thêm dòng này!
    Long userId;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    BlogStatus status;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

