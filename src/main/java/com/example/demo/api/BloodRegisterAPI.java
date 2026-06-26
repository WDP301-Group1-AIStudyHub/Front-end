package com.example.demo.api;

import com.example.demo.dto.request.BloodRegisterRequest;
import com.example.demo.dto.request.BloodSetCompletedRequest;
import com.example.demo.dto.response.BloodRegisterHistoryResponse;
import com.example.demo.dto.response.BloodRegisterListResponse;
import com.example.demo.dto.response.BloodRegisterResponse;
import com.example.demo.dto.response.DonationHistoryResponse;
import com.example.demo.enums.BloodRegisterStatus;
import com.example.demo.repository.AuthenticationRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.service.BloodRegisterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blood-register")
@CrossOrigin("*")
@SecurityRequirement(name = "api")
@RequiredArgsConstructor
public class BloodRegisterAPI {
    private final BloodRegisterService bloodRegisterService;

    @Autowired
    AuthenticationRepository authenticationRepository;
    NotificationRepository notificationRepository;

    @PostMapping("/create")
    @Operation(summary = "Tạo 1 đơn hiến máu mới")
    public ResponseEntity<BloodRegisterResponse> create(@Valid @RequestBody BloodRegisterRequest bloodRegisterRequest) {
        return ResponseEntity.ok(bloodRegisterService.create(bloodRegisterRequest));
    }

    @PutMapping("update/{id}")
    @Operation(summary = "Cập nhật thông tin đơn hiến máu theo ID")
    public ResponseEntity<BloodRegisterResponse> update(@Valid @PathVariable Long id, @RequestBody BloodRegisterRequest bloodRegisterRequest) {
        return ResponseEntity.ok(bloodRegisterService.update(id, bloodRegisterRequest));
    }

    @PostMapping("/set-complete")
    @Operation(summary = "Đánh dấu đơn hiến máu là đã hoàn thành")
    public ResponseEntity<BloodRegisterResponse> setCompleted(@RequestBody BloodSetCompletedRequest bloodSetCompletedRequest) {
        return ResponseEntity.ok(bloodRegisterService.setCompleted(bloodSetCompletedRequest));
    }

    @PatchMapping("/update-status/{id}")
    @Operation(summary = "Cập nhật trạng thái của đơn hiến máu theo ID")
    public ResponseEntity<String> updateStatus(@PathVariable Long id, @RequestParam("status") BloodRegisterStatus status) {
        bloodRegisterService.updateStatus(id, status);
        return ResponseEntity.ok("Status updated successfully");
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Lấy danh sách đơn hiến máu theo ID người dùng")
    public ResponseEntity<List<BloodRegisterListResponse>> getByUserId(@PathVariable Long userId) {
        List<BloodRegisterListResponse> result = bloodRegisterService.getByUserId(userId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/list-by-status")
    @Operation(summary = "Lấy danh sách đơn hiến máu theo trạng thái")
    public ResponseEntity<List<BloodRegisterListResponse>> getByStatus(@RequestParam(value = "status", required = false) List<BloodRegisterStatus> statuses) {
        List<BloodRegisterListResponse> result;

        if (statuses != null && !statuses.isEmpty()) {
            result = bloodRegisterService.getByStatuses(statuses);
        } else {
            result = bloodRegisterService.getAll();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/history/{userId}")
    @Operation(summary = "Lấy lịch sử hiến máu của người dùng theo ID")
    public ResponseEntity<List<DonationHistoryResponse>> getHistoryByUserId(@PathVariable Long userId) {
        List<DonationHistoryResponse> result = bloodRegisterService.getHistoryByUserId(userId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/get-list-donation")
    @Operation(summary = "Lấy danh sách đơn hiến máu đã hoàn thành")
    public ResponseEntity<List<BloodRegisterHistoryResponse>> getListDonation() {
        List<BloodRegisterHistoryResponse> result = bloodRegisterService.getListDonation();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/completed-monthly/{year}")
    @Operation(summary = "Lấy số lượng đơn hiến máu đã hoàn thành theo tháng trong năm")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyCompleted(@PathVariable @RequestParam(defaultValue = "2025")  int year) {
        List<Map<String, Object>> result = bloodRegisterService.getMonthlyCompletedCount(year);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/invite")
    @Operation(summary = "Gửi lời mời hiến máu cho người dùng phù hợp theo nhóm máu và ngày hiến máu cuối")
    public ResponseEntity<Map<String, Object>> invite(@RequestParam String bloodType) {
        int count = 0;
        try {
            count = bloodRegisterService.inviteEligibleUsers(bloodType);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi khi gửi lời mời: " + e.getMessage()));
        }
        Map<String, Object> result = Map.of(
                "message", "Đã gửi lời mời hiến máu cho người phù hợp nhóm máu " + bloodType,
                "count", count
        );
        return ResponseEntity.ok(result);
    }
}