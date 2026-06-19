package com.example.demo.entity;

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
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    long id;
    LocalDate issueDate;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blood_register_id")
    @JsonIgnore
    BloodRegister bloodRegister;

    // Người cấp chứng nhận (staff)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    @JsonIgnore
    User staff;
}
