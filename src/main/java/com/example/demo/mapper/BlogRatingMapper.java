package com.example.demo.mapper;

import com.example.demo.dto.response.BlogRatingResponse;
import com.example.demo.entity.BlogRating;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BlogRatingMapper {
    @Mapping(target = "blogId", source = "blog.id")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userName", source = "user.fullName") // hoặc user.email tùy bạn
    BlogRatingResponse toResponse(BlogRating entity);
}
