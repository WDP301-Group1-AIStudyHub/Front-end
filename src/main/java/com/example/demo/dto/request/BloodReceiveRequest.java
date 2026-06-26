package com.example.demo.dto.request;

import com.example.demo.enums.BloodType;
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
public class BloodReceiveRequest {
    @NotNull(message = "Ngày sinh là bắt buộc")
    @Past(message = "Ngày sinh phải trong quá khứ")
    @Schema(example = "2000-01-15", description = "Ngày sinh của bệnh nhân")
    LocalDate birthdate;

    @NotNull(message = "Chiều cao là bắt buộc")
    @Min(value = 50, message = "Chiều cao phải ít nhất 50cm")
    @Max(value = 250, message = "Chiều cao phải dưới 250cm")
    @Schema(example = "175", description = "Chiều cao của bệnh nhân tính bằng centimeters")
    double height;

    @NotNull(message = "Cân nặng là bắt buộc")
    @Min(value = 30, message = "Cân nặng phải ít nhất 30kg")
    @Max(value = 300, message = "Cân nặng phải dưới 300kg")
    @Schema(example = "70", description = "Cân nặng của bệnh nhân tính bằng kilograms")
    double weight;

    @Past(message = "Ngày hiến máu cuối cùng phải trong quá khứ")
    @Schema(example = "2025-05-20", description = "Ngày hiến máu cuối cùng của bệnh nhân")
    LocalDate lastDonation;

    @Size(max = 1000, message = "Tiền sử y tế phải ít hơn 1000 ký tự")
    @Schema(example = "Không có", description = "Tiền sử y tế liên quan của bệnh nhân")
    String medicalHistory;

    @NotNull(message = "Nhóm máu là bắt buộc")
    @Enumerated(EnumType.STRING)
    @Schema(example = "A_POSITIVE", description = "Nhóm máu cần thiết")
    BloodType bloodType;

    @Schema(example = "false", description = "Đây có phải là yêu cầu khẩn cấp hay không")
    boolean isEmergency;

    @NotNull(message = "Ngày mong muốn là bắt buộc")
    @FutureOrPresent(message = "Ngày mong muốn phải là hôm nay hoặc trong tương lai")
    @Schema(example = "2025-10-15", description = "Ngày yêu cầu nhận máu")
    LocalDate wantedDate;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm:ss")
    @Schema(example = "10:30:00", description = "Thời gian yêu cầu nhận máu")
    LocalTime wantedHour;

    @Schema(example = "Nguyễn Văn A", description = "Tên người liên hệ khẩn cấp")
    String emergencyName;

    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Số điện thoại khẩn cấp phải là số điện thoại hợp lệ")
    @Schema(example = "0123456789", description = "Số điện thoại người liên hệ khẩn cấp")
    String emergencyPhone;
}
