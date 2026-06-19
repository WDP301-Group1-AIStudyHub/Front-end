package com.example.demo.api;

import com.example.demo.dto.request.ReportRequest;
import com.example.demo.dto.response.ReportResponse;
import com.example.demo.service.ReportService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/report")
@SecurityRequirement(name = "api")
@RequiredArgsConstructor
public class ReportAPI {
    @Autowired
    private final ReportService reportService;

    // GET /api/report/list
    @GetMapping("/list")
    public ResponseEntity<List<ReportResponse>> getReports() {
        return ResponseEntity.ok(reportService.listReports());
    }

    // POST /api/report/create
    @PostMapping("/create")
    public ResponseEntity<ReportResponse> createReport(@Valid @RequestBody ReportRequest request) {
        return ResponseEntity.ok(reportService.createReport(request));
    }

    // GET /api/report/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ReportResponse> getReport(@PathVariable Long id) {
        ReportResponse response = reportService.getReport(id); // Nếu không tìm thấy sẽ ném ResourceNotFoundException
        return ResponseEntity.ok(response);
    }

    // PATCH /api/report/update/{id}
    @PatchMapping("/update/{id}")
    public ResponseEntity<ReportResponse> updateReport(@Valid @PathVariable Long id, @RequestBody ReportRequest request) {
        ReportResponse response = reportService.updateReport(id, request); // Nếu không tìm thấy sẽ ném ResourceNotFoundException
        return ResponseEntity.ok(response);
    }

    // DELETE /api/report/delete/{id}
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        reportService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }
}
