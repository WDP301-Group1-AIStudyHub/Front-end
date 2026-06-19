package com.example.demo.service;

import com.example.demo.dto.request.ForgotPasswordRequest;
import com.example.demo.dto.request.ResetPasswordRequest;
import com.example.demo.dto.response.OTPResponse;
import com.example.demo.entity.PasswordResetOtp;
import com.example.demo.entity.User;
import com.example.demo.exception.exceptions.GlobalException;
import com.example.demo.mapper.OTPMapper;
import com.example.demo.repository.AuthenticationRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PasswordResetService {
    private final AuthenticationRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    private final Map<String, PasswordResetOtp> otpMap = new ConcurrentHashMap<>();
    private final int OTP_EXPIRY_MINUTES = 2;

    @Autowired
    TokenService tokenService;

    @Autowired
    AuthenticationRepository authenticationRepository;

    @Autowired
    OTPMapper otpMapper;


    @Transactional
    public void sendOtp(ForgotPasswordRequest request) {
        String email = request.getEmail();

        // Kiểm tra user tồn tại
        User user = userRepository.findUserByEmail(email);
        if (user == null) {
            throw new GlobalException("Email không tồn tại trong hệ thống");
        }

        // Tạo OTP mới và ghi đè OTP cũ (nếu có)
        String otp = generateOtp();
        PasswordResetOtp otpEntry = PasswordResetOtp.builder()
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .used(false)
                .build();
        otpMap.put(email, otpEntry);
        // Send email with OTP
        String subject = "Mã OTP đặt lại mật khẩu";

        emailService.sendResetOTPMail(email, subject, otp, OTP_EXPIRY_MINUTES);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String token = request.getToken();
        String newPassword = request.getNewPassword();

        // Lấy email từ token
        String email;
        try {
            email = tokenService.extractClaim(token, io.jsonwebtoken.Claims::getSubject);
        } catch (Exception e) {
            throw new GlobalException("Token không hợp lệ hoặc đã hết hạn");
        }

        // Lấy user từ email
        User user = userRepository.findUserByEmail(email);
        if (user == null) {
            throw new GlobalException("Người dùng không tồn tại");
        }

        // Cập nhật mật khẩu mới
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Gửi email xác nhận
        String subject = "Mật khẩu của bạn đã được đặt lại";
        emailService.sendAcpResetPasswordMail(email, subject);
    }

    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000); // 6-digit OTP
        return String.valueOf(otp);
    }

    @Transactional
    public OTPResponse verifyOtp(String email, String otp) {
        if (otp == null || otp.isBlank()) {
            throw new GlobalException("Mã OTP không được để trống");
        }
        User user = authenticationRepository.findUserByEmail(email);
        PasswordResetOtp entry = otpMap.get(email);

        if (entry == null) {
            throw new GlobalException("Không tìm thấy mã OTP hoặc đã hết hạn");
        }

        if (entry.isUsed()) {
            throw new GlobalException("Mã OTP đã được sử dụng");
        }

        if (LocalDateTime.now().isAfter(entry.getExpiryTime())) {
            otpMap.remove(email);
            throw new GlobalException("Mã OTP đã hết hạn");
        }

        if (!entry.getOtp().equals(otp)) {
            throw new GlobalException("Mã OTP không chính xác");
        }

        // Đánh dấu đã dùng
        entry.setUsed(true);
        String token = tokenService.generateToken(user);

        return new OTPResponse(token);
    }
}