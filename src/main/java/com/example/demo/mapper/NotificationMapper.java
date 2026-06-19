package com.example.demo.mapper;

import com.example.demo.dto.request.NotificationCreateRequest;
import com.example.demo.dto.response.NotificationResponse;
import com.example.demo.entity.Notification;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface NotificationMapper {

        @Mapping(target = "id", ignore = true)
        @Mapping(target = "recipient", ignore = true)
        @Mapping(target = "createdAt", ignore = true)
        Notification toNotification(NotificationCreateRequest request);


        @Mapping(target = "read", source = "read")
        @Mapping(target = "recipientName", source = "recipient.fullName")
        @Mapping(target = "recipientEmail", source = "recipient.email")
        NotificationResponse toNotificationResponse(Notification notification);

        @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
        @Mapping(target = "id", ignore = true)
        @Mapping(target = "recipient", ignore = true)
        @Mapping(target = "createdAt", ignore = true)
        Notification updateNotification(@MappingTarget Notification entity, NotificationCreateRequest request);
}