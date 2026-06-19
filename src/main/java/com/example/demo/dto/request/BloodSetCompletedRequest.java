package com.example.demo.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class BloodSetCompletedRequest {
    @NotNull(message = "ID máu không được để trống")
    @Min(value = 1, message = "ID máu phải là số nguyên dương")
    long bloodId;

    @NotNull(message = "Ngày thực hiện không được để trống")
    @FutureOrPresent(message = "Ngày thực hiện phải là ngày hiện tại hoặc trong tương lai")
    LocalDate implementationDate;

    @NotNull(message = "Số lượng đơn vị không được để trống")
    @Min(value = 1, message = "Đơn vị máu phải lớn hơn 0")
    int unit;
}
