package com.example.demo.dto.response;


import com.example.demo.enums.BloodReceiveStatus;
import com.example.demo.enums.BloodType;
import com.fasterxml.jackson.annotation.JsonFormat;
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
public class BloodReceiveListResponse {
    long id;
    String fullName;
    @Enumerated(EnumType.STRING)
    BloodReceiveStatus status;
    LocalDate wantedDate;
    @JsonFormat(pattern = "HH:mm:ss")
    LocalTime wantedHour;
    BloodType bloodType;
    boolean isEmergency;
}
