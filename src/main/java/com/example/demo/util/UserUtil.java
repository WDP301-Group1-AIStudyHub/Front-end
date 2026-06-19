package com.example.demo.util;

import com.example.demo.entity.User;
import com.example.demo.enums.Role;
import com.example.demo.exception.exceptions.GlobalException;

public class UserUtil {
    public static void setRole(User user, Role role) {
        if (user == null) {
            throw new IllegalArgumentException("User must not be null");
        }
        if (role == null) {
            throw new IllegalArgumentException("Role must not be null");
        }
        user.setRole(role);
    }

    public static boolean hasRole(User user, Role role) {
        if (user == null || role == null) return false;
        return role.equals(user.getRole());
    }

    public static boolean hasAnyRole(User user, Role... roles) {
        if (user == null || roles == null) return false;
        for (Role role : roles) {
            if (role.equals(user.getRole())) return true;
        }
        return false;
    }

    /**
     * Throw GlobalException nếu user không có bất kỳ quyền nào trong danh sách.
     * @param user user cần kiểm tra
     * @param message thông báo lỗi muốn trả về
     * @param roles danh sách role hợp lệ
     */
    public static void checkRoleOrThrow(User user, String message, Role... roles) {
        if (!hasAnyRole(user, roles)) {
            throw new GlobalException(message);
        }
    }
}
