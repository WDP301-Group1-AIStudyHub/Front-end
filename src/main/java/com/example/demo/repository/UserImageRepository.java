package com.example.demo.repository;

import com.example.demo.entity.UserImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserImageRepository extends JpaRepository<UserImage, Long> {
    List<UserImage> findByUserId(Long userId);
}
