package com.example.demo.repository;

import com.example.demo.entity.HealthCheck;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HealthCheckRepository extends JpaRepository<HealthCheck, Long> {
    Optional<HealthCheck> findHealthCheckById(Long bloodRegisterId);
}
