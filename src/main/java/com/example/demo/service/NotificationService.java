package com.example.demo.service;

import com.example.demo.dto.request.NotificationCreateRequest;
import com.example.demo.dto.response.NotificationResponse;
import com.example.demo.dto.response.UnreadCountResponse;
import com.example.demo.entity.Notification;
import com.example.demo.entity.User;
import com.example.demo.enums.NotificationType;
import com.example.demo.exception.exceptions.GlobalException;
import com.example.demo.mapper.NotificationMapper;
import com.example.demo.repository.AuthenticationRepository;
import com.example.demo.repository.NotificationRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final AuthenticationRepository authenticationRepository;

    @Transactional
    public NotificationResponse createNotification(NotificationCreateRequest request) {
        User recipient = authenticationRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new GlobalException("không tìm thấy người dùng với ID: " + request.getRecipientId()));
        
        Notification notification = notificationMapper.toNotification(request);
        notification.setRecipient(recipient);
        
        Notification savedNotification = notificationRepository.save(notification);
        return notificationMapper.toNotificationResponse(savedNotification);
    }

    @Transactional
    public NotificationResponse createNotification(String title, String message, NotificationType type, User recipient) {
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(type)
                .recipient(recipient)
                .read(false)
                .build();
        
        Notification savedNotification = notificationRepository.save(notification);
        return notificationMapper.toNotificationResponse(savedNotification);
    }

    public List<NotificationResponse> getNotificationsByUser(User user) {
        List<Notification> notifications = notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
        return notifications.stream()
                .map(notificationMapper::toNotificationResponse)
                .collect(Collectors.toList());
    }

    public List<NotificationResponse> getNotificationsByUserId(Long userId) {
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        return notifications.stream()
                .map(notificationMapper::toNotificationResponse)//trả về danh sách thông báo của người dùng theo ID
                .collect(Collectors.toList());
    }

    @Transactional
    public NotificationResponse markAsRead(Long notificationId, User currentUser) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new GlobalException("Không tìm thấy thông báo với ID: " + notificationId));
        
        // Check if current user is the recipient
        if (notification.getRecipient().getId() != currentUser.getId()) {
            throw new GlobalException("Không được phép sửa đổi thông báo này");
        }

        notification.setRead(true);
        Notification savedNotification = notificationRepository.save(notification);
        return notificationMapper.toNotificationResponse(savedNotification);
    }

    @Transactional
    public void deleteNotification(Long notificationId, User currentUser) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new GlobalException("Không tìm thấy thông báo với ID: " + notificationId));
        
        // Check if current user is the recipient
        if (notification.getRecipient().getId() != currentUser.getId()) {
            throw new GlobalException("Không được phép sửa đổi thông báo này");
        }
        
        notificationRepository.delete(notification);
    }

    public UnreadCountResponse getUnreadCount(User user) {
        Long count = notificationRepository.countUnreadByRecipientId(user.getId());
        return UnreadCountResponse.builder()
                .unreadCount(count)
                .build();
    }

    public UnreadCountResponse getUnreadCountByUserId(Long userId) {
        Long count = notificationRepository.countUnreadByRecipientId(userId);
        return UnreadCountResponse.builder()
                .unreadCount(count)
                .build();
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadForUser(user.getId());
    }

    @Transactional
    public void markAllAsReadForUser(Long userId) {
        notificationRepository.markAllAsReadForUser(userId);
    }

    // Helper methods for common notification types
    @Transactional
    public void createBloodRequestNotification(User recipient, String details) {
        createNotification(
                "Yêu cầu máu mới",
                "Một yêu cầu hiến máu mới đã được tạo. " + details,
                NotificationType.BLOOD_REQUEST,
                recipient
        );
    }

    @Transactional
    public void createEmergencyRequestNotification(User recipient, String details) {
        createNotification(
                "Yêu cầu máu khẩn cấp",
                "GẤP: Cần hiến máu khẩn cấp!" + details,
                NotificationType.EMERGENCY_REQUEST,
                recipient
        );
    }

    @Transactional
    public void createDonationCompletedNotification(User recipient, String details) {
        createNotification(
                "Hoàn thành hiến máu",
                "Việc hiến máu của bạn đã hoàn tất thành công. " + details,
                NotificationType.DONATION_COMPLETED,
                recipient
        );
    }

    @Transactional
    public void createDonationReminderNotification(User recipient, String details) {
        createNotification(
                "Nhắc nhở quyên góp",
                "Nhắc nhở: Lịch hiến máu của bạn sắp đến. " + details,
                NotificationType.BLOOD_DONATION_REMINDER,
                recipient
        );
    }

    @Transactional
    public void createSystemAnnouncementNotification(User recipient, String title, String message) {
        createNotification(
                title,
                message,
                NotificationType.SYSTEM_ANNOUNCEMENT,
                recipient
        );
    }
}