package com.example.demo.dto.response;

import com.example.demo.enums.BloodType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class BloodRegisterHistoryResponse {
    long id;
    String fullName;
    String phone;
    String email;
    @Enumerated(EnumType.STRING)
    BloodType bloodType;
    LocalDate lastDonation;
    Integer unitDonation;
    long bloodRegisterId;
    boolean hasCertificate;
}
