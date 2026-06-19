package com.example.demo.dto.response;

import com.example.demo.enums.BloodType;
import com.example.demo.enums.Gender;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class BloodReceiveResponse {
    long id;
    String fullName;
    String email;
    String phone;
    String address;
    String location;
    Gender gender;
    LocalDate birthdate;
    boolean isEmergency;
    double height;
    double weight;
    LocalDate lastDonation;
    String medicalHistory;
    @Enumerated(EnumType.STRING)
    BloodType bloodType;
    LocalDate wantedDate;
    LocalTime wantedHour;
    String emergencyName;
    String emergencyPhone;
}
