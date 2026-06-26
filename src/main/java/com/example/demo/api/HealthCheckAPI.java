package com.example.demo.api;


import com.example.demo.dto.request.HealthCheckRequest;
import com.example.demo.dto.response.HealthCheckResponse;
import com.example.demo.service.HealthCheckService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/health-check")
@CrossOrigin("*")
@SecurityRequirement(name = "api")
@RequiredArgsConstructor
public class HealthCheckAPI {
    @Autowired
    private final HealthCheckService healthCheckService;

    @PostMapping("/create")
    @Operation(summary = "Tạo mới kiểm tra sức khỏe cho người hiến máu")
    public ResponseEntity<HealthCheckResponse> create(@Valid HealthCheckRequest healthCheckRequest) {
        HealthCheckResponse response = healthCheckService.create(healthCheckRequest);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/update/{id}")
    @Operation(summary = "Cập nhật thông tin kiểm tra sức khỏe")
    public ResponseEntity<HealthCheckResponse> update(@Valid @PathVariable Long id, @RequestBody HealthCheckRequest healthCheckRequest) {
        HealthCheckResponse response = healthCheckService.update(id, healthCheckRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/get/{id}")
    @Operation(summary = "Lấy thông tin kiểm tra sức khỏe theo ID")
    public ResponseEntity<HealthCheckResponse> getById(@PathVariable Long id) {
        HealthCheckResponse response = healthCheckService.getHealthCheckById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("get-list")
    @Operation(summary = "Lấy danh sách kiểm tra sức khỏe")
    public ResponseEntity<List<HealthCheckResponse>> getListHealthCheck() {
        return ResponseEntity.ok(healthCheckService.getListHealthChecks());
    }
}
