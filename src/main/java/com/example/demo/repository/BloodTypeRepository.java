package com.example.demo.repository;

import com.example.demo.entity.BloodDonationHistory;
import com.example.demo.enums.BloodType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BloodTypeRepository extends JpaRepository<BloodDonationHistory, Long> {
    BloodDonationHistory findBloodByBloodType(BloodType bloodType);
}
