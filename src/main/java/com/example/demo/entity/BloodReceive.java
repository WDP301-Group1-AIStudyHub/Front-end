package com.example.demo.entity;

import com.example.demo.enums.BloodReceiveStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@Getter
@Setter

public class BloodReceive {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    long id;

    @Enumerated(EnumType.STRING)
    BloodReceiveStatus status;

    LocalDate wantedDate;

    @JsonFormat(pattern = "HH:mm:ss")
    LocalTime wantedHour;
    boolean isEmergency;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    User user;

    @OneToOne(mappedBy = "bloodReceive",cascade = CascadeType.ALL)
    BloodReceiveHistory bloodReceiveHistory;
}
