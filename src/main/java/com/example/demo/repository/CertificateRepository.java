package com.example.demo.repository;

import com.example.demo.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    @Query("SELECT c FROM Certificate c WHERE c.bloodRegister.user.id = :userId")
    List<Certificate> findAllByBloodRegisterByUserId(@Param("userId") Long userId);
}
