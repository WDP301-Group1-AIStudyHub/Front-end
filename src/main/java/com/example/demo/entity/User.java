package com.example.demo.entity;
import com.example.demo.enums.BloodType;
import com.example.demo.enums.Gender;
import com.example.demo.enums.Role;
import com.example.demo.enums.UserStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.internal.util.collections.CollectionHelper;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@Getter
@Setter
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
     long id;
     String fullName;
    @Column(unique = true)
     String email;
     String password;
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
     Role role;

    @Enumerated(EnumType.STRING)
     BloodType bloodType;
    @Enumerated(EnumType.STRING)
    UserStatus status;

    @OneToMany(mappedBy = "user", orphanRemoval = true )
    List<BloodRegister> registers;

    @OneToMany(mappedBy = "user", orphanRemoval = true )
    List<BloodRegister> receive;

    @OneToMany(mappedBy = "recipient", orphanRemoval = true)
    List<Notification> notifications;

    @JsonIgnore
    @OneToMany(mappedBy = "staff", orphanRemoval = true)
    List<Certificate> certificatesIssued;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserImage> images = new ArrayList<>();

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return null;
    }
    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public String getUsername() {
        return this.email;
    }
}
