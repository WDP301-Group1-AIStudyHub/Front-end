package com.example.demo.dto.request;

import lombok.Data;

@Data
public class EmailDetail {
    private String recipient;
    private String subject;
}
