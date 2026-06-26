package com.example.demo.repository;

import com.example.demo.entity.BlogRating;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlogRatingRepository extends JpaRepository<BlogRating, Long> {
    // có thể thêm hàm custom nếu muốn
}