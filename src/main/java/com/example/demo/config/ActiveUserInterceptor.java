package com.example.demo.config;

import com.example.demo.entity.User;
import com.example.demo.enums.UserStatus;
import com.example.demo.exception.exceptions.InactiveUserException;
import com.example.demo.service.AuthenticationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class ActiveUserInterceptor implements HandlerInterceptor {
    @Autowired
    private AuthenticationService authenticationService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        User currentUser = authenticationService.getCurrentUser();
        if (currentUser == null) return true;

        if (currentUser.getStatus() == UserStatus.BANNED) {
            throw new InactiveUserException("Tài khoản đã bị khóa.");
        } else if (currentUser.getStatus() == UserStatus.DELETED) {
            throw new InactiveUserException("Tài khoản đã bị xóa.");
        } else if (currentUser.getStatus() != UserStatus.ACTIVE) {
            throw new InactiveUserException("Tài khoản chưa được kích hoạt.");
        }
        return true;
    }

}
