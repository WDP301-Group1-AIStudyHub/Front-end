package com.example.demo.mapper;

import com.example.demo.dto.request.BlogRequest;
import com.example.demo.dto.response.BlogResponse;
import com.example.demo.entity.Blog;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface BlogMapper {
    Blog toEntity(BlogRequest request);
    BlogResponse toResponse(Blog blog);
}
