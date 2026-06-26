package com.example.demo.api;

import com.example.demo.dto.request.LoginRequest;
import com.example.demo.dto.response.LoginResponse;
import com.example.demo.dto.response.UserResponse;
import com.example.demo.entity.User;
import com.example.demo.dto.request.RegisterRequest;
import com.example.demo.enums.Role;
import com.example.demo.repository.AuthenticationRepository;
import com.example.demo.service.AuthenticationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin("*")
@SecurityRequirement(name = "api")
public class AuthenticationAPI {

    @Autowired
    private final AuthenticationService authenticationService;

    @Autowired
    AuthenticationRepository authenticationRespository;

    public AuthenticationAPI(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký người dùng mới")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authenticationService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập người dùng")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        LoginResponse response = authenticationService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    // API endpoint để lấy thông tin người dùng theo email
    @GetMapping("/find-by-email")
    public ResponseEntity<User> getUserByEmail(@RequestParam String email) {
        User user = authenticationRespository.findUserByEmail(email);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/set-role")
    @Operation(summary = "Cập nhật vai trò của người dùng")
    public ResponseEntity<?> setRole(@RequestParam String email, @RequestParam Role role) {
        return ResponseEntity.ok(authenticationService.setRole(email, role));
    }

    
}