package com.example.demo.repository;

import com.example.demo.entity.BloodReceiveHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BloodReceiveHistoryRepository extends JpaRepository<BloodReceiveHistory, Long> {
    @Query("SELECT h FROM BloodReceiveHistory h WHERE h.bloodReceive.user.id = :userId")
    List<BloodReceiveHistory> findByUserId(@Param("userId") Long userId);
}
