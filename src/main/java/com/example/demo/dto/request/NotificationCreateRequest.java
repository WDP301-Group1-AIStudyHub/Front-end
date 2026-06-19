package com.example.demo.dto.request;

import com.example.demo.enums.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class NotificationCreateRequest {
    @NotBlank(message = "Title không được để trống")
    String title;
    @NotBlank(message = "Message không được để trống")
    String message;
    @NotNull(message = "Type không được để trống")
    NotificationType type;
    @NotNull(message = "Recipient ID không được để trống")
    Long recipientId;
}