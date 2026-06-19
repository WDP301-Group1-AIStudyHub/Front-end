# Notification System Documentation

## Overview
This document describes the comprehensive notification system implemented for the bloodDonationHistory donation application.

## Components

### 1. Entity and Database
- **Notification Entity**: Contains id, title, message, type, recipient, isRead, createdAt
- **NotificationType Enum**: BLOOD_REQUEST, BLOOD_DONATION_REMINDER, EMERGENCY_REQUEST, DONATION_COMPLETED, SYSTEM_ANNOUNCEMENT

### 2. Repository Layer
- **NotificationRepository**: Custom query methods for filtering by user, unread counts, and bulk operations

### 3. Service Layer
- **NotificationService**: Core CRUD operations and helper methods for auto-creating notifications

### 4. API Controller
- **NotificationAPI**: RESTful endpoints with JWT security

### 5. DTOs
- **NotificationResponse**: Response DTO with notification details
- **NotificationCreateRequest**: Request DTO for creating notifications
- **UnreadCountResponse**: Simple response for unread count

### 6. Mapper
- **NotificationMapper**: MapStruct mapper for entity-DTO conversion

## API Endpoints

### User Endpoints
- `GET /api/notifications` - Get notification list for current user
- `GET /api/notifications/unread-count` - Get unread count for current user
- `PUT /api/notifications/{id}/mark-read` - Mark notification as read
- `DELETE /api/notifications/{id}` - Delete notification
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read

### Admin Endpoints
- `POST /api/notifications/create` - Create notification
- `GET /api/notifications/user/{userId}` - Get notifications for specific user
- `GET /api/notifications/user/{userId}/unread-count` - Get unread count for specific user
- `PUT /api/notifications/user/{userId}/mark-all-read` - Mark all notifications as read for specific user

## Auto-Integration

### Blood Request Creation
- Automatic notification when BloodReceive is created
- Emergency notifications for urgent requests

### Blood Donation Registration
- Automatic notification when BloodRegister is created

### Donation Completion
- Automatic notification when bloodDonationHistory donation/receive is completed
- Includes details about units and bloodDonationHistory type

### Status Change Notifications
- Automatic notifications when BloodReceive status changes (APPROVED, REJECTED, COMPLETED, INCOMPLETED, CANCELED)
- Automatic notifications when BloodRegister status changes (APPROVED, REJECTED, INCOMPLETED, CANCELED)
- Status-specific messages inform users of approval, rejection, completion, or cancellation

## Security
- All endpoints require JWT authentication
- Users can only access their own notifications
- Admin endpoints for cross-user operations

## Testing
- Unit tests with Mockito for service layer validation
- Tests cover all major notification creation scenarios

## Usage Examples

### Creating Emergency Notification
```java
notificationService.createEmergencyRequestNotification(
    user, 
    "Blood type: O-, Units needed: 2, Hospital: City General"
);
```

### Getting User Notifications
```java
List<NotificationResponse> notifications = notificationService.getNotificationsByUser(user);
```

### Checking Unread Count
```java
UnreadCountResponse count = notificationService.getUnreadCount(user);
```

This notification system ensures users are kept informed about bloodDonationHistory donation activities, emergency requests, and donation completions in real-time.