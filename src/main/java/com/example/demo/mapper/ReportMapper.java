package com.example.demo.mapper;

import com.example.demo.dto.request.ReportRequest;
import com.example.demo.dto.response.ReportResponse;
import com.example.demo.entity.Report;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReportMapper {
    Report toEntity(ReportRequest dto);

    @Mapping(source = "createdBy", target = "createdBy")
    ReportResponse toDTO(Report entity);
}
