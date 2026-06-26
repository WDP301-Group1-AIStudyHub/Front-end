package com.example.demo.dto.response;

import com.example.demo.enums.NotificationType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder

public class NotificationResponse {
    Long id;
    String title;
    String message;
    NotificationType type;
    boolean read;
    LocalDateTime createdAt;
    String recipientName;
    String recipientEmail;
}