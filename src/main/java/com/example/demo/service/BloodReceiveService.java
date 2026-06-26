package com.example.demo.service;

import com.example.demo.dto.request.BloodReceiveRequest;
import com.example.demo.dto.request.BloodSetCompletedRequest;
import com.example.demo.dto.response.*;
import com.example.demo.entity.*;
import com.example.demo.enums.BloodReceiveStatus;
import com.example.demo.enums.BloodRegisterStatus;
import com.example.demo.enums.BloodType;
import com.example.demo.enums.Role;
import com.example.demo.exception.exceptions.AuthenticationException;
import com.example.demo.exception.exceptions.GlobalException;
import com.example.demo.mapper.BloodReceiveMapper;
import com.example.demo.repository.BloodInventoryRepository;
import com.example.demo.repository.BloodReceiveHistoryRepository;
import com.example.demo.repository.BloodReceiveRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BloodReceiveService {
    private final BloodReceiveRepository bloodReceiveRepository;
    private final BloodReceiveMapper bloodReceiveMapper;
    private final AuthenticationService authenticationService;
    private final BloodInventoryRepository bloodInventoryRepository;
    private final NotificationService notificationService;

    @Autowired
    BloodReceiveHistoryRepository bloodReceiveHistoryRepository;


    public List<BloodReceiveListResponse> getAll() {
        List<BloodReceive> bloodReceives = bloodReceiveRepository.findAll();
        User currentUser = authenticationService.getCurrentUser();
        if(!Role.STAFF.equals(currentUser.getRole()) && !Role.ADMIN.equals(currentUser.getRole())) {
            throw new GlobalException("Bạn không có quyền truy xuất danh sách đơn đăng ký nhận máu");
        }
        return bloodReceives.stream()
                .map(bloodReceive -> BloodReceiveListResponse.builder()
                        .id(bloodReceive.getId())
                        .fullName(bloodReceive.getUser().getFullName())
                        .status(bloodReceive.getStatus())
                        .wantedDate(bloodReceive.getWantedDate())
                        .wantedHour(bloodReceive.getWantedHour())
                        .bloodType(bloodReceive.getUser().getBloodType())
                        .isEmergency(bloodReceive.isEmergency())
                        .build())
                .toList();
    }

    public List<BloodReceiveListResponse> getByStatuses(List<BloodReceiveStatus> statuses) {
        List<BloodReceive> bloodReceives = bloodReceiveRepository.findByStatusIn(statuses);
        User currentUser = authenticationService.getCurrentUser();
        if(!Role.STAFF.equals(currentUser.getRole()) && !Role.ADMIN.equals(currentUser.getRole())) {
            throw new GlobalException("Bạn không có quyền truy xuất danh sách đơn đăng ký nhận máu");
        }
        return bloodReceives.stream()
                .map(bloodReceive -> BloodReceiveListResponse.builder()
                        .id(bloodReceive.getId())
                        .fullName(bloodReceive.getUser().getFullName())
                        .status(bloodReceive.getStatus())
                        .wantedDate(bloodReceive.getWantedDate())
                        .wantedHour(bloodReceive.getWantedHour())
                        .bloodType(bloodReceive.getUser().getBloodType())
                        .isEmergency(bloodReceive.isEmergency())
                        .build())
                .toList();
    }

    @Transactional
    public BloodReceiveResponse create(BloodReceiveRequest request) {
        User currentUser = authenticationService.getCurrentUser();

        // Update user information
        currentUser.setWeight(request.getWeight());
        currentUser.setHeight(request.getHeight());
        currentUser.setBirthdate(request.getBirthdate());
        currentUser.setLastDonation(request.getLastDonation());
        currentUser.setMedicalHistory(request.getMedicalHistory());
        currentUser.setBloodType(request.getBloodType());
        currentUser.setEmergencyName(request.getEmergencyName());
        currentUser.setEmergencyPhone(request.getEmergencyPhone());

        // Create blood receive record
        BloodReceive bloodReceive = bloodReceiveMapper.toBloodReceive(request);
        bloodReceive.setStatus(BloodReceiveStatus.PENDING);
        bloodReceive.setUser(currentUser);
        bloodReceive.setEmergency(request.isEmergency());
        bloodReceive.setWantedDate(request.getWantedDate());
        bloodReceive.setWantedHour(request.getWantedHour());
        bloodReceiveRepository.save(bloodReceive);

        // Create notification for blood request
        String notificationMessage = "Nhóm máu: " + currentUser.getBloodType() +
                ", Ngày: " + request.getWantedDate() +
                ", Giờ: " + request.getWantedHour();
        if (request.isEmergency()) {
            notificationService.createEmergencyRequestNotification(currentUser, notificationMessage);
        } else {
            notificationService.createBloodRequestNotification(currentUser, notificationMessage);
        }

        return createResponseFromUserAndReceive(currentUser, bloodReceive);
    }

    @Transactional
    public BloodReceiveResponse update(Long id, BloodReceiveRequest request) {
        BloodReceive bloodReceive = bloodReceiveRepository.findById(id)
                .orElseThrow(() -> new AuthenticationException("Đơn yêu cầu không tồn tại"));

        if (bloodReceive.getStatus() == BloodReceiveStatus.PENDING) {
            User currentUser = authenticationService.getCurrentUser();

            if (!bloodReceive.getUser().getEmail().equals(currentUser.getEmail())) {
                throw new AuthenticationException("Bạn không có quyền cập nhật đơn yêu cầu này");
            }

            // Update user information
            currentUser.setWeight(request.getWeight());
            currentUser.setHeight(request.getHeight());
            currentUser.setBirthdate(request.getBirthdate());
            currentUser.setLastDonation(request.getLastDonation());
            currentUser.setMedicalHistory(request.getMedicalHistory());
            currentUser.setBloodType(request.getBloodType());
            currentUser.setEmergencyName(request.getEmergencyName());
            currentUser.setEmergencyPhone(request.getEmergencyPhone());

            bloodReceive.setWantedHour(request.getWantedHour());
            bloodReceiveRepository.save(bloodReceive);

            return createResponseFromUserAndReceive(currentUser, bloodReceive);
        } else {
            throw new AuthenticationException("Đơn yêu cầu đã được xử lý và không thể cập nhật");
        }
    }

    @Transactional
    public void updateStatus(Long id, BloodReceiveStatus status) {
        BloodReceive bloodReceive = bloodReceiveRepository.findById(id)
                .orElseThrow(() -> new AuthenticationException("Đơn yêu cầu không tồn tại"));

        User currentUser = authenticationService.getCurrentUser();

        switch (status) {
            case APPROVED:
                if (currentUser.getRole() != Role.ADMIN) {
                    throw new AuthenticationException("Bạn không có quyền duyệt đơn");
                }
                bloodReceive.setStatus(BloodReceiveStatus.APPROVED);
                notificationService.createSystemAnnouncementNotification(
                        bloodReceive.getUser(),
                        "Đơn yêu cầu nhận máu đã được duyệt",
                        "Đơn yêu cầu nhận máu của bạn đã được duyệt và đang được xử lý."
                );
                break;
            case REJECTED:
                if (currentUser.getRole() != Role.ADMIN) {
                    throw new AuthenticationException("Bạn không có quyền từ chối đơn");
                }
                bloodReceive.setStatus(BloodReceiveStatus.REJECTED);
                notificationService.createSystemAnnouncementNotification(
                        bloodReceive.getUser(),
                        "Đơn yêu cầu nhận máu bị từ chối",
                        "Đơn yêu cầu nhận máu của bạn đã bị từ chối. Vui lòng liên hệ hỗ trợ để biết thêm thông tin."
                );
                break;
            case COMPLETED:
                if (currentUser.getRole() != Role.STAFF) {
                    throw new AuthenticationException("Bạn không có quyền đánh dấu đơn hoàn thành");
                }
                bloodReceive.setStatus(BloodReceiveStatus.COMPLETED);
                notificationService.createDonationCompletedNotification(
                        bloodReceive.getUser(),
                        "Truyền máu thành công."
                );
                break;
            case INCOMPLETED:
                if (currentUser.getRole() != Role.STAFF) {
                    throw new AuthenticationException("Bạn không có quyền đánh dấu đơn chưa hoàn thành");
                }
                bloodReceive.setStatus(BloodReceiveStatus.INCOMPLETED);
                notificationService.createSystemAnnouncementNotification(
                        bloodReceive.getUser(),
                        "Đơn yêu cầu nhận máu chưa hoàn thành",
                        "Đơn yêu cầu nhận máu của bạn chưa được hoàn thành. Vui lòng liên hệ nhân viên y tế."
                );
                break;
            case CANCELED:
                if (!bloodReceive.getUser().getEmail().equals(currentUser.getEmail()) &&
                        currentUser.getRole() != Role.MEMBER) {
                    throw new AuthenticationException("Bạn không có quyền hủy đơn này");
                }
                bloodReceive.setStatus(BloodReceiveStatus.CANCELED);
                notificationService.createSystemAnnouncementNotification(
                        bloodReceive.getUser(),
                        "Đơn yêu cầu nhận máu đã bị hủy",
                        "Đơn yêu cầu nhận máu của bạn đã bị hủy."
                );
                break;
            default:
                throw new AuthenticationException("Trạng thái không hợp lệ");
        }

        bloodReceiveRepository.save(bloodReceive);
    }

    public BloodReceiveResponse getByUserId(Long id) {
        User currentUser = authenticationService.getCurrentUser();
        if(!Role.STAFF.equals(currentUser.getRole()) && !Role.ADMIN.equals(currentUser.getRole())) {
            throw new GlobalException("Bạn không có quyền xem thông tin đơn yêu cầu này");
        }
        BloodReceive bloodReceive = bloodReceiveRepository.findById(id)
                .orElseThrow(() -> new AuthenticationException("Đơn yêu cầu không tồn tại"));

        return createResponseFromUserAndReceive(bloodReceive.getUser(), bloodReceive);
    }

    private BloodReceiveResponse createResponseFromUserAndReceive(User user, BloodReceive bloodReceive) {
        return BloodReceiveResponse.builder()
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .gender(user.getGender())
                .birthdate(user.getBirthdate())
                .height(user.getHeight())
                .weight(user.getWeight())
                .lastDonation(user.getLastDonation())
                .medicalHistory(user.getMedicalHistory())
                .bloodType(user.getBloodType())
                .wantedDate(bloodReceive.getWantedDate())
                .wantedHour(bloodReceive.getWantedHour())
                .emergencyName(user.getEmergencyName())
                .emergencyPhone(user.getEmergencyPhone())
                .isEmergency(bloodReceive.isEmergency())
                .build();
    }

    @Transactional
    public BloodReceiveResponse setCompleted(BloodSetCompletedRequest request) {
        User currentUser = authenticationService.getCurrentUser();
        if (!Role.STAFF.equals(currentUser.getRole()) && !Role.ADMIN.equals(currentUser.getRole())) {
            throw new GlobalException("Bạn không có quyền lấy máu cho người nhận");
        }

        BloodReceive receive = bloodReceiveRepository.findById(request.getBloodId())
                .orElseThrow(() -> new GlobalException("Đơn yêu cầu nhận máu không tồn tại"));
        if (receive.getStatus() == BloodReceiveStatus.COMPLETED) {
            throw new GlobalException("Đơn nhận máu này đã hoàn thành.");
        }

        BloodType neededType = receive.getUser().getBloodType();
        float requiredUnits = request.getUnit();

        BloodReceive bloodReceive = bloodReceiveRepository.findById(request.getBloodId())
                .orElseThrow(() -> new GlobalException("Đơn yêu cầu nhận máu không tồn tại"));

        List<BloodType> compatibleTypes = BloodType.CompatibleBloodMap.get(neededType);
        if (compatibleTypes == null || compatibleTypes.isEmpty()) {
            throw new GlobalException("Không có nhóm máu phù hợp để truyền cho " + neededType);
        }

        List<BloodInventory> inventories = bloodInventoryRepository
                .findByBloodTypeInAndUnitsAvailableGreaterThan(compatibleTypes, 0f);

        inventories.sort(Comparator.comparingInt(
                inv -> compatibleTypes.indexOf(inv.getBloodType())
        ));

        float collected = 0f;
        List<BloodInventory> usedInventories = new ArrayList<>();

        for (BloodInventory inv : inventories) {
            if (collected >= requiredUnits) break;

            float available = inv.getUnitsAvailable();
            float used = Math.min(available, requiredUnits - collected);

            inv.setUnitsAvailable(available - used);
            collected += used;
            usedInventories.add(inv);
        }

        if (collected < requiredUnits) {
            throw new GlobalException("Không đủ máu để truyền (đã có " + collected + " / cần " + requiredUnits + ")");
        }

        bloodInventoryRepository.saveAll(usedInventories);

        receive.setStatus(BloodReceiveStatus.COMPLETED);
        bloodReceiveRepository.save(receive);

        String completionMessage = "Truyền máu thành công. " +
                "Nhóm máu: " + receive.getUser().getBloodType() +
                ", Số lượng nhận: " + requiredUnits;
        notificationService.createDonationCompletedNotification(receive.getUser(), completionMessage);

        BloodReceiveHistory bloodReceiveHistory = BloodReceiveHistory.builder()
                .bloodType(receive.getUser().getBloodType())
                .unit(requiredUnits)
                .receiveDate(request.getImplementationDate())
                .bloodReceive(receive)
                .build();
        bloodReceiveHistoryRepository.save(bloodReceiveHistory);

        for (BloodInventory inv : inventories) {
            System.out.println("Found inventory: " + inv.getBloodType() + " - available: " + inv.getUnitsAvailable());
        }

        return createResponseFromUserAndReceive(currentUser, receive);
    }

    public List<BloodReceiveListResponse> getListByUserId(Long userId) {
        List<BloodReceive> bloodReceives = bloodReceiveRepository.findByUserId(userId);

        if (bloodReceives.isEmpty()) {
            throw new GlobalException("Không tìm thấy đơn nhận máu nào cho người dùng này");
        }

        return bloodReceives.stream()
                .map(bloodReceive -> BloodReceiveListResponse.builder()
                        .id(bloodReceive.getId())
                        .fullName(bloodReceive.getUser().getFullName())
                        .status(bloodReceive.getStatus())
                        .wantedDate(bloodReceive.getWantedDate())
                        .wantedHour(bloodReceive.getWantedHour())
                        .status(bloodReceive.getStatus())
                        .bloodType(bloodReceive.getUser().getBloodType())
                        .isEmergency(bloodReceive.isEmergency())
                        .build()
                ).collect(Collectors.toList());
    }

    public List<ReceiveHistoryResponse> getListReceiveHistory() {
        User currentUser = authenticationService.getCurrentUser();

        if (!Role.STAFF.equals(currentUser.getRole()) && !Role.ADMIN.equals(currentUser.getRole())) {
            throw new GlobalException("Bạn không có quyền truy xuất danh sách đơn nhận máu");
        }

        List<BloodReceiveHistory> bloodReceives = bloodReceiveHistoryRepository.findAll();

        if (bloodReceives.isEmpty()) {
            throw new GlobalException("Không có lịch sử nhận máu nào được tìm thấy");
        }

        return bloodReceives.stream()
                .map(bloodReceive -> ReceiveHistoryResponse.builder()
                        .id(bloodReceive.getId())
                        .fullName(bloodReceive.getBloodReceive().getUser().getFullName())
                        .receiveDate(bloodReceive.getReceiveDate())
                        .unit(bloodReceive.getUnit())
                        .bloodType(bloodReceive.getBloodType())
                        .build())
                .collect(Collectors.toList());
    }

    public List<ReceiveHistoryResponse> getReceiveHistoryByUserId(Long id) {
        User currentUser = authenticationService.getCurrentUser();
        if (currentUser.getId() != (id)) {
            throw new GlobalException("Bạn không có quyền truy xuất lịch sử nhận máu của người dùng.");
        }

        List<BloodReceiveHistory> histories = bloodReceiveHistoryRepository.findByUserId(id);

        if (histories.isEmpty()) {
            throw new GlobalException("Không có lịch sử nhận máu nào cho người dùng này");
        }

        return histories.stream()
                .filter(bloodReceive -> bloodReceive.getBloodReceive().getStatus().equals(BloodReceiveStatus.COMPLETED))
                .map(history -> {
                    User user = history.getBloodReceive().getUser();
                    return ReceiveHistoryResponse.builder()
                            .id(history.getId())
                            .fullName(user.getFullName())
                            .bloodType(user.getBloodType())
                            .receiveDate(history.getReceiveDate())
                            .unit(history.getUnit())
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<EmergencyBloodTypeResponse> getEmergencyBloodType() {
        List<BloodReceive> bloodReceives = bloodReceiveRepository.findByIsEmergencyTrue();

        return bloodReceives.stream()
                .filter(bloodReceive -> bloodReceive.getUser() != null)
                .filter(bloodReceive -> BloodReceiveStatus.APPROVED.equals(bloodReceive.getStatus()))
                .map(bloodReceive -> bloodReceive.getUser().getBloodType())
                .distinct()
                .map(bloodType -> EmergencyBloodTypeResponse.builder()
                        .bloodType(bloodType)
                        .build())
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getMonthlyReceivedCount(int year) {
        List<Object[]> rawData = bloodReceiveRepository.countCompletedReceivesPerMonth(year);

        Map<Integer, Long> resultMap = new HashMap<>();
        for (Object[] row : rawData) {
            Integer month = ((Number) row[0]).intValue();
            Long total = ((Number) row[1]).longValue();
            resultMap.put(month, total);
        }

        List<Map<String, Object>> finalResult = new ArrayList<>();
        for (int month = 1; month <= 12; month++) {
            Map<String, Object> item = new HashMap<>();
            item.put("month", month);
            item.put("totalCompletedReceives", resultMap.getOrDefault(month, 0L));
            finalResult.add(item);
        }

        return finalResult;
    }

}