package com.example.demo.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class CertificateRequest {
    @NotNull(message = "Ngày cấp không được để trống")
    LocalDate issueDate;

    @NotNull(message = "ID đơn đăng ký không được để trống")
    Long bloodRegisterId;

    @NotNull(message = "ID nhân viên không được để trống")
    Long staffId;
}
