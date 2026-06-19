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
public class BloodDonationHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    long id;

    @Enumerated(EnumType.STRING)
    BloodType bloodType;

    float unit;

    @Column(name = "certificate_id")
    Long certificateId;

    @Temporal(TemporalType.DATE)
    LocalDate expirationDate;
    LocalDate donationDate;

    @OneToOne
    @JoinColumn(name = "bloodInventory_id")
    BloodInventory bloodInventory;


    @OneToOne
    @JoinColumn(name = "bloodRegister_id")
    BloodRegister bloodRegister;



}
