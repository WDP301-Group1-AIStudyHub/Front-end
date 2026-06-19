package com.example.demo.api;

import com.example.demo.dto.request.UpdateStatusRequest;
import com.example.demo.entity.User;
import com.example.demo.enums.UserStatus;
import com.example.demo.repository.AuthenticationRepository;
import com.example.demo.service.UserService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Controller
@RequestMapping("/api")
@CrossOrigin("*")
@SecurityRequirement(name = "api")
public class ActivateEmailAPI {

    @Autowired
    AuthenticationRepository authenticationRepository;

    @Autowired
    UserService updateUserService;

    @GetMapping("/user/activate")
    public String activateAccount(@RequestParam("email") String email, Model model) {
        try {
            User user = authenticationRepository.findUserByEmail(email);

            if (user == null) {
                System.out.println("❌ Step 1 FAILED: User not found for email: " + email);
                model.addAttribute("message", "Tài khoản không tồn tại!");
                return "activateAccounttemplate";
            }


            if (user.getStatus() == UserStatus.ACTIVE) {
                model.addAttribute("message", "Tài khoản đã được kích hoạt trước đó.");
                return "activateAccounttemplate";
            }

            UpdateStatusRequest request = new UpdateStatusRequest();
            request.setUserId(user.getId());
            request.setStatus(UserStatus.ACTIVE);

            updateUserService.updateUserStatus(request);

            model.addAttribute("message", "Kích hoạt tài khoản thành công! Bạn có thể đăng nhập.");

            return "activateAccounttemplate";

        } catch (Exception e) {
            System.out.println("💥 EXCEPTION OCCURRED IN ACTIVATE ACCOUNT:");
            System.out.println("   - Exception Type: " + e.getClass().getSimpleName());
            System.out.println("   - Exception Message: " + e.getMessage());
            System.out.println("   - Stack Trace:");
            e.printStackTrace();

            model.addAttribute("message", "Đã xảy ra lỗi: " + e.getMessage());
            System.out.println("📄 Returning template due to exception: activateAccounttemplate");
            System.out.println("=".repeat(80) + "\n");

            return "activateAccounttemplate";
        }
    }

}