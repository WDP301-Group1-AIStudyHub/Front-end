package com.example.demo.dto.request;

import com.example.demo.enums.BloodRegisterStatus;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class HealthCheckRequest {
    @NotNull(message = "Chiều cao không được để trống")
//    @DecimalMin(value = "50.0", message = "Chiều cao tối thiểu là 50 cm")
//    @DecimalMax(value = "250.0", message = "Chiều cao tối đa là 250 cm")
    Double height;

    @NotNull(message = "Cân nặng không được để trống")
    Double weight;

    @NotNull(message = "Nhiệt độ không được để trống")
    Double temperature;

    @NotNull(message = "Huyết áp không được để trống")
    Double bloodPressure;

    @NotNull(message = "Ngày khám không được để trống")
            @FutureOrPresent(message = "Ngày khám phải là ngày hiện tại hoặc tương lai")
    LocalDate checkDate;

    boolean status;

    @Size(max = 255, message = "Không được vượt quá 255 ký tự")
    String reason;

    @NotNull(message = "Phải có ID đơn đăng ký hiến máu")
    @Min(value = 1, message = "ID đơn đăng ký không hợp lệ")
    Long bloodRegisterId;
}
