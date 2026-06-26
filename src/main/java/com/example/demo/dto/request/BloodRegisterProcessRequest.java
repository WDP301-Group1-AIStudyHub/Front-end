package com.example.demo.dto.request;

import com.example.demo.enums.BloodType;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class BloodRegisterProcessRequest {
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Nhóm máu là bắt buộc")
    BloodType bloodType;

    @NotNull(message = "Số lượng là bắt buộc")
    @Positive(message = "Số lượng phải là số dương")
    float quantity;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy HH:mm:ss")
    @NotNull(message = "Ngày hiến máu là bắt buộc")
    @PastOrPresent(message = "Ngày hiến máu phải là ngày trong quá khứ hoặc hiện tại")
    LocalDateTime donationDate;
}
