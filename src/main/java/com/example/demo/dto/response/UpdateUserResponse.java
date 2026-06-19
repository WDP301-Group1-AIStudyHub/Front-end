package com.example.demo.dto.response;

import com.example.demo.enums.BloodType;
import com.example.demo.enums.Gender;
import com.example.demo.enums.Role;
import com.example.demo.enums.UserStatus;
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
public class UpdateUserResponse {
    long id;
    String fullName;
    String phone;
    String address;
    @Enumerated(EnumType.STRING)
    Gender gender;
    LocalDate birthdate;
    double height;
    double weight;
    LocalDate lastDonation;
    String medicalHistory;
    String emergencyName;
    String emergencyPhone;
    @Enumerated(EnumType.STRING)
    BloodType bloodType;
}
