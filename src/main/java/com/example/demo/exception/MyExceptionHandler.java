package com.example.demo.exception;

import com.example.demo.exception.exceptions.AuthenticationException;
import com.example.demo.exception.exceptions.GlobalException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class MyExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity handleBadRequestException(MethodArgumentNotValidException exception) {
        String responseMessage = "";

        for (FieldError fieldError : exception.getFieldErrors()) {
            responseMessage += fieldError.getDefaultMessage() + "\n";
        }
        return new ResponseEntity(responseMessage, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(com.example.demo.exception.exceptions.AuthenticationException.class)
    public ResponseEntity handleAuthenticationException(AuthenticationException exception) {
        return new ResponseEntity(exception.getMessage(), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(GlobalException.class)
    public ResponseEntity handleAuthenticationException(GlobalException exception) {
        return new ResponseEntity(exception.getMessage(), HttpStatus.BAD_REQUEST);
    }
}
