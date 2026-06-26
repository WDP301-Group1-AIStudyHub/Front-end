package com.example.demo.api;

import com.example.demo.dto.request.*;
import com.example.demo.dto.response.*;

import com.example.demo.dto.request.ForgotPasswordRequest;
import com.example.demo.dto.request.ResetPasswordRequest;
import com.example.demo.dto.request.UserRequest;
import com.example.demo.repository.AuthenticationRepository;
import com.example.demo.service.PasswordResetService;
import com.example.demo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin("*")
@SecurityRequirement(name = "api")
@RequiredArgsConstructor
public class UserAPI {

    @Autowired
    private final AuthenticationRepository authenticationRepository;

    @Autowired
    private final PasswordResetService passwordResetService;

    @Autowired
    private final UserService updateUserService;

    @PutMapping("update-user")
    @Operation(summary = "Cập nhật thông tin người dùng")
    public ResponseEntity<UpdateUserResponse> update(@Valid @RequestBody UserRequest userRequest) {
        return ResponseEntity.ok(updateUserService.updateUser(userRequest));
    }

    @GetMapping("get-user-by-role")
    @Operation(summary = "Lấy danh sách người dùng trừ admin")
    public ResponseEntity<?> getListUserByRole() {
        return ResponseEntity.ok(updateUserService.getUsersExceptAdmin());
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Gửi mã OTP để đặt lại mật khẩu")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.sendOtp(request);
        return ResponseEntity.ok("Mã OTP đã được gửi đến email của bạn");
    }

    @GetMapping("/verify-otp")
    @Operation(summary = "Xác thực mã OTP")
    public ResponseEntity<OTPResponse> verifyOtp(@RequestParam String email, @RequestParam String otp) {
        OTPResponse response = passwordResetService.verifyOtp(email, otp);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Đặt lại mật khẩu bằng mã OTP")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ResponseEntity.ok("Mật khẩu đã được đặt lại thành công");
    }


    @PutMapping("/update-status")
    @Operation(summary = "Cập nhật trạng thái người dùng (chỉ Admin)")
    public ResponseEntity<String> updateUserStatus(@Valid @RequestBody UpdateStatusRequest request) {
        updateUserService.updateUserStatus(request);
        return ResponseEntity.ok("Cập nhật trạng thái người dùng thành công");
    }

    @GetMapping("/get-remind")
    @Operation(summary = "Lấy thông báo nhắc nhở")
    public ResponseEntity<RemindResponse> getRemind() {
        return ResponseEntity.ok(updateUserService.getDonationReminder());
    }


    @GetMapping("/check-donation-ability")
    @Operation(summary = " Kiểm tra khả năng hiến máu")
    public ResponseEntity<CheckDonationAbilityResponse> checkHealth(@RequestParam Long id) {
        return ResponseEntity.ok(updateUserService.checkHealth(id));
    }

//    @PostMapping("/users/{id}/images")
//    @Operation(summary = "Tải lên hình ảnh người dùng")
//    public ResponseEntity<?> uploadUserImage(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
//        String url = updateUserService.saveImage(id, file, "avatar");
//        return ResponseEntity.ok(Map.of("url", url));
//    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Tải lên ảnh và trả về URL ảnh cho user")
    public ResponseEntity<?> uploadUserImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) {
        // Giả sử bạn lưu file vào thư mục uploads/ và trả về URL
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        String uploadDir = "uploads/user_images/";
        try {
            java.nio.file.Path filePath = java.nio.file.Paths.get(uploadDir + fileName);
            file.transferTo(filePath);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Upload failed"));
        }

        // Trả về đường dẫn public URL, ví dụ: http://localhost:8080/uploads/[fileName]
        String url = "uploads/user_images/" + fileName;
        return ResponseEntity.ok(Map.of("url", url));
    }
}
