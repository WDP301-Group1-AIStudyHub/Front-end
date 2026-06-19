package com.example.demo.entity;

import com.example.demo.enums.BloodRegisterStatus;
import com.example.demo.enums.BloodType;
import com.example.demo.enums.HealthCheckStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@Getter
@Setter
public class HealthCheck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    long id;
    String fullName;
    double height;
    double weight;
    double temperature;
    double bloodPressure;
    String medicalHistory;
    LocalDate checkDate;
    @Enumerated(EnumType.STRING)
    BloodType bloodType;
    String staffName;
    boolean status = false;
    String reason;

    @OneToOne(mappedBy = "healthCheck")
    @JsonIgnore
    BloodRegister bloodRegister;

}
