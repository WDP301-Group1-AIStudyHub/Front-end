package com.example.demo.mapper;

import com.example.demo.dto.request.LoginRequest;
import com.example.demo.dto.request.OTPRequest;
import com.example.demo.dto.response.LoginResponse;
import com.example.demo.dto.response.OTPResponse;
import com.example.demo.entity.PasswordResetOtp;
import com.example.demo.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface OTPMapper {
    PasswordResetOtp toOTP(OTPRequest request);
    OTPResponse toOTPResponse(PasswordResetOtp otp);
}
