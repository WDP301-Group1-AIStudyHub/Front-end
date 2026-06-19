package com.example.demo.dto.response;

import com.example.demo.enums.BloodInventoryStatus;
import com.example.demo.enums.BloodType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class BloodInventoryResponse {
    long inventoryId;
    BloodType bloodType;
    float unitsAvailable;
    BloodInventoryStatus status;
}