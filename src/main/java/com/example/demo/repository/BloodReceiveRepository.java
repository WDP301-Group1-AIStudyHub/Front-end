package com.example.demo.repository;

import com.example.demo.entity.BloodReceive;
import com.example.demo.entity.BloodRegister;
import com.example.demo.enums.BloodReceiveStatus;
import com.example.demo.enums.BloodRegisterStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BloodReceiveRepository extends JpaRepository<BloodReceive, Long> {
    List<BloodReceive> findByStatusIn(List<BloodReceiveStatus> statuses);
    List<BloodReceive> findByUserId(Long userId);
    List<BloodReceive> findByIsEmergencyTrue();
    @Query("SELECT MONTH(r.wantedDate), COUNT(r.id) " +
            "FROM BloodReceive r " +
            "WHERE YEAR(r.wantedDate) = :year AND r.status = 'COMPLETED' " +
            "GROUP BY MONTH(r.wantedDate)")
    List<Object[]> countCompletedReceivesPerMonth(@Param("year") int year);

}