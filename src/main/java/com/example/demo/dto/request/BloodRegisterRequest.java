package com.example.demo.dto.request;

import com.example.demo.enums.BloodRegisterStatus;
import com.example.demo.enums.BloodType;
import com.example.demo.enums.Gender;
import com.example.demo.enums.HealthCheckStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class BloodRegisterRequest {
@NotNull(message = "Giới tính là bắt buộc")
    @Enumerated(EnumType.STRING)
    @Schema(example = "MALE", description = "Giới tính bệnh nhân")
    Gender gender;

    @NotNull(message = "Ngày sinh là bắt buộc")
    @Past(message = "Ngày sinh phải trong quá khứ")
    @Schema(example = "1990-01-15", description = "Ngày sinh bệnh nhân")
    LocalDate birthdate;

    @Positive(message = "Chiều cao phải là số dương")
    @Schema(example = "175", description = "Chiều cao bệnh nhân tính bằng cm")
    double height;

    @Positive(message = "Cân nặng phải là số dương")
    @Schema(example = "70", description = "Cân nặng bệnh nhân tính bằng kg")
    double weight;

    @Past(message = "Ngày hiến máu gần nhất phải trong quá khứ")
    @Schema(example = "2025-10-05", description = "Ngày hiến máu gần nhất")
    LocalDate lastDonation;

    @Schema(example = "Không có", description = "Ghi chú lịch sử y tế của bệnh nhân")
    String medicalHistory;

//    @NotNull(message = "Nhóm máu là bắt buộc")
    @Enumerated(EnumType.STRING)
    @Schema(example = "A_POSITIVE", description = "Nhóm máu bệnh nhân")
    BloodType bloodType;

    @NotNull(message = "Ngày mong muốn hiến máu là bắt buộc")
    @FutureOrPresent(message = "Ngày mong muốn hiến máu phải là hiện tại hoặc trong tương lai")
    @Schema(example = "2025-12-20", description = "Ngày yêu cầu hiến máu")
    LocalDate wantedDate;

    @NotNull(message = "Giờ mong muốn hiến máu là bắt buộc")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm:ss")
    @Schema(type = "string", format = "HH:mm:ss",example = "10:30:00", description = "Thời gian yêu cầu hiến máu")
    LocalTime wantedHour;


    @Schema(example = "Nguyễn Văn A", description = "Tên người liên hệ khẩn cấp")
    String emergencyName;

    @NotEmpty(message = "Số điện thoại liên hệ khẩn cấp là bắt buộc")
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Số điện thoại không hợp lệ")
    @Schema(example = "+84123456789", description = "Số điện thoại liên hệ khẩn cấp")
    String emergencyPhone;
}
