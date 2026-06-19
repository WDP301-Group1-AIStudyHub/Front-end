package com.example.demo.repository;

import com.example.demo.dto.response.BloodInventoryResponse;
import com.example.demo.entity.BloodInventory;
import com.example.demo.enums.BloodType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BloodInventoryRepository  extends JpaRepository<BloodInventory, Long>  {
    BloodInventory findByBloodType(BloodType bloodType);
    List<BloodInventory> findByBloodTypeIn(List<String> bloodTypes);
    boolean existsByBloodType(BloodType bloodType);
    List<BloodInventory> findAllByBloodType(BloodType bloodType);
    List<BloodInventory> findByBloodTypeInAndUnitsAvailableGreaterThan(List<BloodType> bloodTypes, float minUnit);
    @Query("SELECT b.unitsAvailable FROM BloodInventory b WHERE b.id = :id")//
    Float findUnitsAvailableById(@Param("id") Long id);// Lấy số lượng máu có sẵn theo ID
    //lay full thong tin kho máu
    @Query("SELECT new com.example.demo.dto.response.BloodInventoryResponse(b.id, b.bloodType, b.unitsAvailable, b.status) " + "FROM BloodInventory b WHERE b.id = :id")
    Optional<BloodInventoryResponse> findFullInfoById(@Param("id") Long id); // Lấy thông tin đầy đủ của kho máu theo ID

}
