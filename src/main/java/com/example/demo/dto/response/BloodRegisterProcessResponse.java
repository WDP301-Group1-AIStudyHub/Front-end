package com.example.demo.dto.response;

import com.example.demo.enums.BloodType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class BloodRegisterProcessResponse {
    long id;
    @Enumerated(EnumType.STRING)
    BloodType bloodType;
    float quantity;
}
