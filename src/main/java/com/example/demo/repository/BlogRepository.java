package com.example.demo.repository;

import com.example.demo.entity.Blog;
import com.example.demo.service.BlogService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogRepository extends JpaRepository<Blog, Long> {
    List<Blog> findByTitleContainingIgnoreCase(String keyword);
    List<Blog> findByAuthorIgnoreCase(String author);
    List<Blog> findByUserId(Long userId);
}
