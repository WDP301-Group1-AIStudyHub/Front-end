package com.example.demo.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "blood-donation")
@Data
public class BloodDonationConfig {
    // Thời gian phục hồi mặc định giữa các lần hiến máu (đơn vị: ngày)
     int recoveryPeriodDays = 90;

    // Số ngày trước khi đủ điều kiện hiến máu để gửi thông báo nhắc nhở
     int reminderBeforeDayCount = 7;
}
