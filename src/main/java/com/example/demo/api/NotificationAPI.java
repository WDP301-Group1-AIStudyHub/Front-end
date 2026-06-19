package com.example.demo.api;

import com.example.demo.dto.request.NotificationCreateRequest;
import com.example.demo.dto.response.NotificationResponse;
import com.example.demo.dto.response.UnreadCountResponse;
import com.example.demo.entity.User;
import com.example.demo.service.AuthenticationService;
import com.example.demo.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin("*")
@SecurityRequirement(name = "api")
@RequiredArgsConstructor
@Tag(name = "Notification API", description = "API for managing notifications")
public class NotificationAPI {
    
    private final NotificationService notificationService;
    private final AuthenticationService authenticationService;

    @GetMapping
    @Operation(summary = "Lấy danh sách thông báo cho người dùng hiện tại")
    public ResponseEntity<List<NotificationResponse>> getNotifications() {
        User currentUser = authenticationService.getCurrentUser();
        List<NotificationResponse> notifications = notificationService.getNotificationsByUser(currentUser);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Nhận số lượng thông báo chưa đọc cho người dùng hiện tại")
    public ResponseEntity<UnreadCountResponse> getUnreadCount() {
        User currentUser = authenticationService.getCurrentUser();
        UnreadCountResponse response = notificationService.getUnreadCount(currentUser);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/mark-read")
    @Operation(summary = "Đánh dấu thông báo là đã đọc")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long id) {
        User currentUser = authenticationService.getCurrentUser();
        NotificationResponse response = notificationService.markAsRead(id, currentUser);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa thông báo")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        User currentUser = authenticationService.getCurrentUser();
        notificationService.deleteNotification(id, currentUser);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/mark-all-read")
    @Operation(summary = "Đánh dấu tất cả thông báo là đã đọc")
    public ResponseEntity<Void> markAllAsRead() {
        User currentUser = authenticationService.getCurrentUser();
        notificationService.markAllAsRead(currentUser);
        return ResponseEntity.ok().build();
    }

    // Admin endpoints
    @PostMapping("/create")
    @Operation(summary = "Tạo 1 thông báo mới (Admin only)")
    public ResponseEntity<NotificationResponse> createNotification(@Valid @RequestBody NotificationCreateRequest request) {
        NotificationResponse response = notificationService.createNotification(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Lấy danh sách thông báo cho người dùng theo ID (Admin only)")
    public ResponseEntity<List<NotificationResponse>> getNotificationsByUserId(@PathVariable Long userId) {
        List<NotificationResponse> notifications = notificationService.getNotificationsByUserId(userId);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/user/{userId}/unread-count")
    @Operation(summary = "Nhận số lượng thông báo chưa đọc cho người dùng theo ID (Admin only)")
    public ResponseEntity<UnreadCountResponse> getUnreadCountByUserId(@PathVariable Long userId) {
        UnreadCountResponse response = notificationService.getUnreadCountByUserId(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/user/{userId}/mark-all-read")
    @Operation(summary = "Đánh dấu tất cả thông báo là đã đọc cho người dùng theo ID (Admin only)")
    public ResponseEntity<Void> markAllAsReadForUser(@PathVariable Long userId) {
        notificationService.markAllAsReadForUser(userId);
        return ResponseEntity.ok().build();
    }


}