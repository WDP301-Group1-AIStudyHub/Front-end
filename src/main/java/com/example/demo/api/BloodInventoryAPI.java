package com.example.demo.api;

import com.example.demo.dto.request.BloodInventoryRequest;
import com.example.demo.dto.response.BloodInventoryResponse;
import com.example.demo.dto.response.BloodTypeTotalResponse;
import com.example.demo.repository.BloodInventoryRepository;
import com.example.demo.service.BloodInventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/blood-inventory")
@SecurityRequirement(name = "api")
public class BloodInventoryAPI {
    @Autowired
    BloodInventoryService service;

    @Autowired
    BloodInventoryRepository  bloodInventoryRepository;

    @GetMapping("/get-all")
    @Operation(summary = "Lấy danh sách tất cả kho máu")
    public ResponseEntity<List<BloodTypeTotalResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/get/{id}")
    @Operation(summary = "Lấy thông tin kho máu theo ID")
    public ResponseEntity<BloodInventoryResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping("/create")
    @Operation(summary = "Tạo kho máu mới")
    public ResponseEntity<BloodInventoryResponse> create(@Valid @RequestBody BloodInventoryRequest request) {
        return new ResponseEntity<>(service.create(request), HttpStatus.CREATED);
    }


    @PutMapping("/update/{id}")
    @Operation(summary = "Cập nhật thông tin kho máu theo ID")
    public ResponseEntity<BloodInventoryResponse> update(@PathVariable Long id, @Valid @RequestBody BloodInventoryRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PatchMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

}