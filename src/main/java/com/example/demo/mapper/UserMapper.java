package com.example.demo.mapper;


import com.example.demo.dto.request.LoginRequest;
import com.example.demo.dto.request.RegisterRequest;
import com.example.demo.dto.request.UserRequest;
import com.example.demo.dto.response.LoginResponse;
import com.example.demo.dto.response.UserResponse;
import com.example.demo.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    User toUser(LoginRequest request);
    LoginResponse toUserResponse(User user);

    User toUser(RegisterRequest request);

    User toUpdateUser(UserRequest request);
    UserResponse toUpdateUserResponse(User user);
}
