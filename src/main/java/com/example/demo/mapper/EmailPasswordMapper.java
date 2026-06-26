package com.example.demo.mapper;

import com.example.demo.dto.request.EmailPasswordRequest;
import com.example.demo.dto.response.EmailPasswordResponse;
import com.example.demo.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface EmailPasswordMapper {
    User toUpdateEmailPassword(EmailPasswordRequest emailPasswordRequest);
    EmailPasswordResponse toEmailPasswordResponse(User user);
}
