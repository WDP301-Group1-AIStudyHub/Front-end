package com.example.demo.entity;

import com.example.demo.enums.BloodType;
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
public class BloodReceiveHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    long id;

    @Enumerated(EnumType.STRING)
    BloodType bloodType;

    float unit;

    LocalDate receiveDate;

    @OneToOne
    @JoinColumn(name = "bloodReceive_id")
    BloodReceive bloodReceive;
}
