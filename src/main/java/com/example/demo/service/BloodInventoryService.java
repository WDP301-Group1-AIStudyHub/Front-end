package com.example.demo.service;

import com.example.demo.dto.request.BloodInventoryRequest;
import com.example.demo.dto.response.BloodInventoryResponse;
import com.example.demo.dto.response.BloodTypeTotalResponse;
import com.example.demo.entity.BloodDonationHistory;
import com.example.demo.entity.BloodInventory;
import com.example.demo.entity.User;
import com.example.demo.enums.BloodInventoryStatus;
import com.example.demo.enums.BloodType;
import com.example.demo.enums.Role;
import com.example.demo.exception.exceptions.GlobalException;
import com.example.demo.exception.exceptions.ResourceNotFoundException;
import com.example.demo.mapper.BloodInventoryMapper;
import com.example.demo.repository.BloodInventoryRepository;
import com.example.demo.repository.BloodDonationHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class BloodInventoryService {
    @Autowired
    BloodInventoryRepository bloodInventoryRepository;

    @Autowired
    BloodInventoryMapper bloodInventoryMapper;

    @Autowired
    BloodDonationHistoryRepository bloodDonationHistoryRepository;

    @Autowired
    AuthenticationService authenticationService;

    public List<BloodTypeTotalResponse> getAll() {
        try {
            User currentUser = authenticationService.getCurrentUser();
            if (!Role.STAFF.equals(currentUser.getRole()) && !Role.ADMIN.equals(currentUser.getRole())) {
                throw new GlobalException("Bạn không có quyền truy xuất kho máu");
            }

            List<BloodInventory> inventories = bloodInventoryRepository.findAll();

            // Trả về 8 loại máu và tổng số lượng từng loại
            return Arrays.stream(BloodType.values())
                    .map(type -> new BloodTypeTotalResponse(
                            type,
                            inventories.stream()
                                    .filter(inv -> type.equals(inv.getBloodType()))
                                    .mapToInt(inv -> (int)inv.getUnitsAvailable()) // hoặc .getQuantity() nếu dùng trường này
                                    .sum()
                    ))
                    .collect(Collectors.toList());
        } catch (GlobalException e) {
            throw e;
        } catch (Exception e) {
            throw new GlobalException("Lỗi khi truy xuất tổng kho máu: " + e.getMessage());
        }
    }


    public BloodInventoryResponse getById(Long id) {
        User currentUser = authenticationService.getCurrentUser();

        // Kiểm tra quyền của người dùng
        if (!Role.STAFF.equals(currentUser.getRole()) && !Role.ADMIN.equals(currentUser.getRole())) {
            throw new GlobalException("Bạn không có quyền truy xuất kho máu.");
        }

        // Lấy thông tin kho máu theo id
        try {
            BloodInventory inventory = bloodInventoryRepository.findById(id)
                    .orElseThrow(() -> new GlobalException("Không tìm thấy kho máu với ID: " + id));
            return toResponse(inventory);
        } catch (GlobalException e) {
            // Để ngoại lệ ResourceNotFoundException tự động được ném ra
            throw e;
        } catch (Exception e) {
            // Xử lý lỗi chung với thông báo chi tiết hơn
            throw new GlobalException("Lỗi khi truy xuất kho máu với ID: " + id + ". Lỗi chi tiết: " + e.getMessage());
        }
    }


    public BloodInventoryResponse create(BloodInventoryRequest req) {
        User currentUser = authenticationService.getCurrentUser();
        if (!Role.STAFF.equals(currentUser.getRole()) && !Role.ADMIN.equals(currentUser.getRole())) {
            throw new GlobalException("Bạn không có quyền tạo kho máu");
        }
        try {
            BloodInventory entity = toEntity(req);
            if (entity.getStatus() == null) {
                entity.setStatus(BloodInventoryStatus.AVAILABLE);
            }
            BloodInventory saved = bloodInventoryRepository.save(entity);
            return toResponse(saved);
        } catch (Exception e) {
            throw new GlobalException("Lỗi khi tạo mới kho máu");
        }
    }

    public BloodInventoryResponse update(Long id, BloodInventoryRequest req) {
        User currentUser = authenticationService.getCurrentUser();
        if(!Role.STAFF.equals(currentUser.getRole()) && !Role.ADMIN.equals(currentUser.getRole())) {
            throw new GlobalException("Bạn không có quyền cập nhật kho máu");
        }
        try {
            BloodInventory old = bloodInventoryRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho máu với ID: " + id));

            // Use the mapper instead of manual field setting
            BloodInventory updated = bloodInventoryMapper.updateBloodInventory(old, req);
            BloodInventory saved = bloodInventoryRepository.save(updated);
            return toResponse(saved);
        } catch (ResourceNotFoundException e) {
            // Let ResourceNotFoundException propagate up without wrapping
            throw e;
        } catch (Exception e) {
            throw new GlobalException("Lỗi khi cập nhật kho máu với ID: " + id);
        }
    }


    public void delete(Long id) {
        User currentUser = authenticationService.getCurrentUser();
        if (!Role.STAFF.equals(currentUser.getRole()) && !Role.ADMIN.equals(currentUser.getRole())) {
            throw new GlobalException("Bạn không có quyền xoá kho máu");
        }
        try {
            BloodInventory inventory = bloodInventoryRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho máu với ID: " + id));
            inventory.setStatus(BloodInventoryStatus.DELETED);
            bloodInventoryRepository.save(inventory);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new GlobalException("Lỗi khi thực hiện xoá mềm kho máu với ID: " + id);
        }
    }

    // Helper methods for conversion between entity and DTOs
    private BloodInventory toEntity(BloodInventoryRequest request) {
        return bloodInventoryMapper.toBloodInventory(request);
    }

    private BloodInventoryResponse toResponse(BloodInventory entity) {
        return bloodInventoryMapper.toBloodInventoryResponse(entity);
    }
/// ////////////////////////////// khong dc xoa /////////////////////////////////////////////////////////////////////
    @Scheduled(cron = "0 0 0 * * *") // Chạy mỗi ngày lúc 0h00
    public void resetExpiredBloodUnits() {
        try {
            LocalDate today = LocalDate.now();
            // Danh sách máu hết hạn
            List<BloodDonationHistory> expiredBloodDonationHistoryList = bloodDonationHistoryRepository.findByExpirationDateBefore(today);

            for (BloodDonationHistory expiredBloodDonationHistory : expiredBloodDonationHistoryList) {
                BloodInventory inventory = expiredBloodDonationHistory.getBloodInventory();
                inventory.setUnitsAvailable(0);
                bloodInventoryRepository.save(inventory);
            }

            bloodInventoryRepository.saveAll(
                    expiredBloodDonationHistoryList.stream().map(BloodDonationHistory::getBloodInventory).distinct().toList()
            );
        } catch (Exception e) {
            throw new GlobalException("Lỗi khi cập nhật máu hết hạn");
        }
    }
}
