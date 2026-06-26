package com.example.demo.dto.request;

import com.example.demo.enums.BloodInventoryStatus;
import com.example.demo.enums.BloodType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class BloodInventoryRequest {
    @NotNull(message = "Nhóm máu không được để trống")
        BloodType bloodType;
        @Min(value = 1, message = "Đơn vị khả dụng phải có ít nhất 1")
        float unitsAvailable;
        @NotNull(message = "Ngày hết hạn không được để trống")
        java.time.LocalDateTime expirationDate;

        BloodInventoryStatus status;
}