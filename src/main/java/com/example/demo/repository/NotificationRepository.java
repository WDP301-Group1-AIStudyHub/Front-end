package com.example.demo.repository;

import com.example.demo.entity.Notification;
import com.example.demo.entity.User;
import com.example.demo.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);
    
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipient.id = :recipientId AND n.read = false")
    Long countUnreadByRecipientId(@Param("recipientId") Long recipientId);


    List<Notification> findByRecipientAndReadFalseOrderByCreatedAtDesc(User recipient);
    List<Notification> findByRecipientIdAndReadFalseOrderByCreatedAtDesc(Long recipientId);

    List<Notification> findTop5ByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient.id = :recipientId AND n.read = false")
    int markAllAsReadForUser(@Param("recipientId") Long recipientId);
    
    List<Notification> findByType(NotificationType type);
    
    void deleteByRecipientId(Long recipientId);
}