package com.example.demo.dto.response;

import com.example.demo.enums.BloodType;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BloodTypeTotalResponse {
    private BloodType bloodType;
    private int total;
}
