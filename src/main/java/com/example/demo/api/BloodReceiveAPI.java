package com.example.demo.api;

import com.example.demo.dto.request.BloodReceiveRequest;
import com.example.demo.dto.request.BloodSetCompletedRequest;
import com.example.demo.dto.response.BloodReceiveResponse;
import com.example.demo.dto.response.BloodReceiveListResponse;
import com.example.demo.dto.response.EmergencyBloodTypeResponse;
import com.example.demo.dto.response.ReceiveHistoryResponse;
import com.example.demo.enums.BloodReceiveStatus;
import com.example.demo.service.BloodReceiveService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blood-receive")
@CrossOrigin("*")
@SecurityRequirement(name = "api")
@RequiredArgsConstructor
public class BloodReceiveAPI {
    // Fix: inject the service instead of the API itself
    private final BloodReceiveService bloodReceiveService;

    @GetMapping("/list-by-status")
    @Operation(summary = "Lấy danh sách yêu cầu nhận máu theo trạng thái")
    public ResponseEntity<List<BloodReceiveListResponse>> getByStatus(@RequestParam(value = "status", required = false) List<BloodReceiveStatus> statuses) {
        List<BloodReceiveListResponse> result;

        if (statuses != null && !statuses.isEmpty()) {
            result = bloodReceiveService.getByStatuses(statuses);
        } else {
            result = bloodReceiveService.getAll();
        }

        return ResponseEntity.ok(result);
    }


    @PostMapping("/create")
    @Operation(summary = "Tạo 1 yêu cầu nhận máu mới")
    public ResponseEntity<BloodReceiveResponse> create(@Valid @RequestBody BloodReceiveRequest request) {
        return ResponseEntity.ok(bloodReceiveService.create(request));
    }

    @PutMapping("/update/{id}")
    @Operation(summary = "Cập nhật thông tin yêu cầu nhận máu theo ID")
    public ResponseEntity<BloodReceiveResponse> update(@Valid @PathVariable Long id,
                                                       @RequestBody BloodReceiveRequest request) {
        return ResponseEntity.ok(bloodReceiveService.update(id, request));
    }

    @GetMapping("/get/{id}")
    @Operation(summary = "Lấy thông tin yêu cầu nhận máu theo ID")
    public ResponseEntity<BloodReceiveResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(bloodReceiveService.getByUserId(id));
    }

    @PatchMapping("/update-status/{id}")
    @Operation(summary = "Cập nhật trạng thái của yêu cầu nhận máu theo ID")
    public ResponseEntity<Void> updateStatus(@Valid @PathVariable Long id,
                                             @RequestParam BloodReceiveStatus status) {
        bloodReceiveService.updateStatus(id, status);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/set-complete")
    @Operation(summary = "Đánh dấu yêu cầu nhận máu là đã hoàn thành")
    public ResponseEntity<BloodReceiveResponse> setCompleted(@RequestBody BloodSetCompletedRequest bloodSetCompletedRequest) {
        return ResponseEntity.ok(bloodReceiveService.setCompleted(bloodSetCompletedRequest));
    }

    @GetMapping("/get-blood-receive-by-user-id")
    @Operation(summary = "Lấy danh sách yêu cầu nhận máu theo ID người dùng")
    public ResponseEntity<List<BloodReceiveListResponse>> getBloodReceiveByUserId(@RequestParam Long userId) {
        List<BloodReceiveListResponse> result = bloodReceiveService.getListByUserId(userId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/get-list-receive")
    @Operation(summary = "Lấy danh sách lịch sử nhận máu")
    public ResponseEntity<List<ReceiveHistoryResponse>> getListReceiveHistory(){
        List<ReceiveHistoryResponse> result = bloodReceiveService.getListReceiveHistory();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/get-emergency-bloodType")
    @Operation(summary = "Lấy danh sách loại máu khẩn cấp")
    public ResponseEntity<List<EmergencyBloodTypeResponse>> getEmergencyBloodType() {
        List<EmergencyBloodTypeResponse> result = bloodReceiveService.getEmergencyBloodType();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/monthly-completed")
    @Operation(summary = "Lấy số lượng yêu cầu nhận máu đã hoàn thành theo tháng trong năm")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyCompletedReceives( @PathVariable
            @RequestParam(defaultValue = "2025") int year) {
        List<Map<String, Object>> data = bloodReceiveService.getMonthlyReceivedCount(year);
        return ResponseEntity.ok(data);
    }

    @GetMapping("/get-list-receive-by-user-id")
    @Operation(summary = "Lấy danh sách lịch sử nhận máu theo ID người dùng")
    public ResponseEntity<List<ReceiveHistoryResponse>> getListReceiveByUserId(@RequestParam Long userId) {
        List<ReceiveHistoryResponse> result = bloodReceiveService.getReceiveHistoryByUserId(userId);
        return ResponseEntity.ok(result);
    }
}