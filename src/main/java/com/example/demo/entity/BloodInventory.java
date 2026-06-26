package com.example.demo.entity;

import com.example.demo.enums.BloodInventoryStatus;
import com.example.demo.enums.BloodType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@Getter
@Setter
public class BloodInventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long inventoryId;

    @Enumerated(EnumType.STRING) // Specify that the enum will be stored as a string
    BloodType bloodType;

    @Column(name = "units_available")
    float unitsAvailable;

    @OneToOne(mappedBy = "bloodInventory")
    BloodDonationHistory bloods;

    @Enumerated(EnumType.STRING)
    BloodInventoryStatus status;

    // Safe method to convert string to enum
    public static BloodInventoryStatus safeEnum(String value) {
        try {
            return BloodInventoryStatus.valueOf(value);
        } catch (IllegalArgumentException e) {
            // Handle invalid value and return a default value (e.g., AVAILABLE)
            return BloodInventoryStatus.AVAILABLE; // Default value
        }
    }
}
