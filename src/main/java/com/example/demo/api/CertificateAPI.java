package com.example.demo.api;

import com.example.demo.dto.request.CertificateRequest;
import com.example.demo.dto.response.CertificateResponse;
import com.example.demo.service.CertificateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certificates")
@CrossOrigin("*")
@SecurityRequirement(name = "api")
@RequiredArgsConstructor
public class CertificateAPI {
    @Autowired
    CertificateService certificateService;

    @PostMapping("/create-certificate")
    @Operation(summary = "Tạo chứng nhận hiến máu")
    public ResponseEntity<CertificateResponse> create(@Valid @RequestBody CertificateRequest request){
        return ResponseEntity.ok(certificateService.create(request));
    }

   @GetMapping("/donor/{donorId}")
    @Operation(summary = "Lấy tất cả chứng nhận theo ID người hiến máu")
    public ResponseEntity<List<CertificateResponse>> getCertificatesByDonor(@PathVariable Long donorId) {
        return ResponseEntity.ok(certificateService.getCertificatesByDonorId(donorId));
    }

    @GetMapping("/get-certificate-by-id/{id}")
    @Operation(summary = "Lấy chứng nhận hiến máu theo ID đơn đăng ký")
    public ResponseEntity<CertificateResponse> getCertificateById(@PathVariable Long id) {
        return ResponseEntity.ok(certificateService.getCertificateById(id));
    }
}
