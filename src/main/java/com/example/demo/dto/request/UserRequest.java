package com.example.demo.dto.request;

import com.example.demo.enums.BloodType;
import com.example.demo.enums.Gender;
import com.example.demo.enums.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Column;
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
public class UserRequest {
    @Schema(description = "Họ và tên người hiến máu", example = "Nguyễn Văn A")
    @NotBlank(message = "Họ và tên không được để trống") // Fullname cannot be empty
    @Pattern(regexp = "^[a-zA-ZÀ-ỹ\\s]{2,50}$", message = "Họ và tên phải từ 2-50 ký tự và không chứa ký tự đặc biệt")
    String fullName;

    @Schema(description = "Số điện thoại người hiến máu", example = "0987654321")
    @NotBlank(message = "Số điện thoại không được để trống") // Phone cannot be empty
    @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ")
    String phone;

    @Schema(description = "Địa chỉ nơi cư trú", example = "Ho Chi Minh")
    @NotBlank(message = "Địa chỉ không được để trống") // Address cannot be empty
    String address;

    @NotNull(message = "Giới tính không được để trống") // Gender cannot be empty
    @Enumerated(EnumType.STRING)
    Gender gender;

    @Schema(description = "Ngày sinh có định dạng yyyy-MM-dd", example = "1995-08-15")
    @NotNull(message = "Ngày sinh không được để trống") // Birthdate cannot be empty
    @Past(message = "Ngày sinh phải là ngày trong quá khứ")
    LocalDate birthdate;

    @Min(value = 100, message = "Chiều cao phải lớn hơn hoặc bằng 100cm")
    @Max(value = 250, message = "Chiều cao phải nhỏ hơn hoặc bằng 250cm")
    Double height; // Chiều cao (cm)

    @Min(value = 40, message = "Cân nặng phải lớn hơn hoặc bằng 40kg")
    @Max(value = 200, message = "Cân nặng phải nhỏ hơn hoặc bằng 200kg")
    Double weight; // Cân nặng (kg)

    @Schema(description = "Ngày hiến máu gần nhất (định dạng yyyy-MM-dd)", example = "2024-06-01")
    @Past(message = "Ngày hiến máu gần nhất phải là ngày trong quá khứ")
    LocalDate lastDonation; // Ngày hiến máu gần nhất

    @Schema(description = "Tiền sử bệnh (nếu có)", example = "Không có")
    String medicalHistory; // Tiền sử bệnh

    @Schema(description = "Tên người liên hệ khẩn cấp", example = "Trần Thị B")
    @NotBlank(message = "Tên người liên hệ khẩn cấp không được để trống")
    String emergencyName; // Tên người liên hệ khẩn cấp

    @Schema(description = "Số điện thoại người liên hệ khẩn cấp", example = "0912345678")
    @NotBlank(message = "Số điện thoại liên hệ khẩn cấp không được để trống")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại khẩn cấp không hợp lệ")
    String emergencyPhone; // Số điện thoại liên hệ khẩn cấp

    @NotNull(message = "Nhóm máu không được để trống") // Blood type cannot be empty
    @Enumerated(EnumType.STRING)
    BloodType bloodType; // Nhóm máu
}
