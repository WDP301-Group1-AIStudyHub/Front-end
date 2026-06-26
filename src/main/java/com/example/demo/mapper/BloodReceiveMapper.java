package com.example.demo.mapper;

import com.example.demo.dto.request.BloodReceiveRequest;
import com.example.demo.dto.response.BloodReceiveResponse;
import com.example.demo.entity.BloodReceive;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface BloodReceiveMapper {

    BloodReceive toBloodReceive(BloodReceiveRequest request);
    BloodReceiveResponse toBloodReceiveResponse(BloodReceive bloodReceive);
}