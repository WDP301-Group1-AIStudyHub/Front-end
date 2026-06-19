package com.example.demo.repository;

import com.example.demo.dto.response.BloodRegisterResponse;
import com.example.demo.entity.BloodRegister;
import com.example.demo.enums.BloodRegisterStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BloodRegisterRepository extends JpaRepository<BloodRegister, Long> {
    List<BloodRegister> findByStatusIn(List<BloodRegisterStatus> statuses);

    List<BloodRegister> findByUserId(Long userId);

    long countByUserIdAndStatus(Long userId, BloodRegisterStatus status);

    @Query("SELECT MONTH(b.wantedDate), COUNT(b.id) " +
            "FROM BloodRegister b " +
            "WHERE YEAR(b.wantedDate) = :year AND b.status = 'COMPLETED' " +
            "GROUP BY MONTH(b.wantedDate)")
    List<Object[]> countCompletedRegistersPerMonth(@Param("year") int year);
}

