package com.example.demo.service;

import com.example.demo.dto.request.ReportRequest;
import com.example.demo.dto.response.ReportResponse;
import com.example.demo.entity.Report;
import com.example.demo.entity.User;
import com.example.demo.enums.Role;
import com.example.demo.exception.exceptions.GlobalException;
import com.example.demo.mapper.ReportMapper;
import com.example.demo.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {
    @Autowired
    private final ReportMapper reportMapper;

    @Autowired
    private final ReportRepository reportRepository;

    @Autowired
    AuthenticationService authenticationService;

    private User getStaffUserOrThrow() {
        User currentUser = authenticationService.getCurrentUser();
        if (!Role.STAFF.equals(currentUser.getRole())) {
            throw new GlobalException("Bạn không có quyền truy cập báo cáo");
        }
        return currentUser;
    }

    public List<ReportResponse> listReports() {
        getStaffUserOrThrow();
        return reportRepository.findAllByIsDeletedFalse().stream()
                .map(reportMapper::toDTO)
                .collect(Collectors.toList());
    }

    public ReportResponse createReport(ReportRequest dto) {
        User currentUser = getStaffUserOrThrow();
        Report report = reportMapper.toEntity(dto);
        report.setCreatedAt(LocalDateTime.now());
        report.setUpdatedAt(LocalDateTime.now());
        report.setIsDeleted(false);
        report.setCreatedBy(currentUser.getFullName()); // Lưu tên người tạo
        return reportMapper.toDTO(reportRepository.save(report));
    }

    public ReportResponse getReport(Long id) {
        getStaffUserOrThrow();
        Report report = reportRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new GlobalException("Không tìm thấy báo cáo với id: " + id));
        return reportMapper.toDTO(report);
    }

    public ReportResponse updateReport(Long id, ReportRequest dto) {
        getStaffUserOrThrow();
        Report report = reportRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new GlobalException("Không tìm thấy báo cáo với id: " + id));
        report.setTitle(dto.getTitle());
        report.setDescription(dto.getDescription());
        report.setType(dto.getType());
        report.setContent(dto.getContent());
        report.setUpdatedAt(LocalDateTime.now());
        return reportMapper.toDTO(reportRepository.save(report));
    }

    public void deleteReport(Long id) {
        getStaffUserOrThrow();
        Report report = reportRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new GlobalException("Không tìm thấy báo cáo với id: " + id));
        report.setIsDeleted(true);
        report.setUpdatedAt(LocalDateTime.now());
        reportRepository.save(report);
    }
}
