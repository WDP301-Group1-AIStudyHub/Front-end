package com.example.demo.service;

import com.example.demo.dto.request.BlogRatingRequest;
import com.example.demo.dto.request.BlogRequest;
import com.example.demo.dto.response.BlogRatingResponse;
import com.example.demo.dto.response.BlogResponse;
import com.example.demo.entity.Blog;
import com.example.demo.entity.BlogRating;
import com.example.demo.entity.User;
import com.example.demo.enums.BlogStatus;
import com.example.demo.enums.Role;
import com.example.demo.exception.exceptions.GlobalException;
import com.example.demo.mapper.BlogRatingMapper;
import com.example.demo.repository.AuthenticationRepository;
import com.example.demo.repository.BlogRatingRepository;
import com.example.demo.repository.BlogRepository;
import com.example.demo.util.UserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlogService {

    @Autowired
    private BlogRepository blogRepository;
    @Autowired
    private BlogRatingRepository blogRatingRepository;
    @Autowired
    private BlogRatingMapper blogRatingMapper;
    @Autowired
    private final AuthenticationService authenticationService;
    private final AuthenticationRepository userRepository;

    // Lấy tất cả blog còn hoạt động
    public List<BlogResponse> getAllBlogs() {
        try {
            return blogRepository.findAll().stream()
                    .filter(blog -> blog.getStatus() == BlogStatus.ACTIVE)
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new GlobalException("Lỗi khi lấy danh sách blog: " + e.getMessage());
        }
    }

    // Lấy chi tiết blog theo ID nếu còn hoạt động
    public Optional<BlogResponse> getBlogById(Long id) {
        try {
            return blogRepository.findById(id)
                    .filter(blog -> blog.getStatus() == BlogStatus.ACTIVE)
                    .map(this::convertToResponse);
        } catch (Exception e) {
            throw new GlobalException("Lỗi khi lấy chi tiết blog: " + e.getMessage());
        }
    }

    //lấy chi tiết blog theo userId nếu còn hoạt động
    public List<BlogResponse> getBlogsByUserId(Long userId) {
        try {
            return blogRepository.findByUserId(userId)
                    .stream()
                    .filter(blog -> blog.getStatus() == BlogStatus.ACTIVE)
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new GlobalException("Lỗi khi lấy blog của userId: " + e.getMessage());
        }
    }


    // Tạo blog mới
    public BlogResponse createBlog(BlogRequest request) {
        try {
            // Lấy user hiện tại
            User currentUser = authenticationService.getCurrentUser();
            if (currentUser == null) {
                throw new GlobalException("Không xác định được người dùng hiện tại");
            }

            Blog blog = convertToEntity(request);
            blog.setAuthor(currentUser.getFullName()); // Gán tên người dùng làm tác giả
            blog.setUserId(currentUser.getId());
            blog.setCreatedAt(LocalDateTime.now());
            blog.setUpdatedAt(LocalDateTime.now());
            blog.setStatus(BlogStatus.ACTIVE);

            Blog saved = blogRepository.save(blog);
            return convertToResponse(saved);
        } catch (Exception e) {
            throw new GlobalException("Lỗi khi tạo blog: " + e.getMessage());
        }
    }

    // Cập nhật blog
    public BlogResponse updateBlog(Long id, BlogRequest request) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new GlobalException("Không tìm thấy blog với ID: " + id));
        blog.setTitle(request.getTitle());
        blog.setContent(request.getContent());
        blog.setImg(request.getImg());
        blog.setUpdatedAt(LocalDateTime.now());
        Blog updated = blogRepository.save(blog);
        return convertToResponse(updated);
    }

    // Đánh dấu blog là đã xoá
    public void deleteBlog(Long id) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new GlobalException("Không tìm thấy blog để xoá"));
        blog.setStatus(BlogStatus.DELETED);
        blogRepository.save(blog);
    }

    // Tìm kiếm theo tiêu đề (chỉ blog ACTIVE)
    public List<BlogResponse> searchByTitle(String keyword) {
        try {
            return blogRepository.findByTitleContainingIgnoreCase(keyword).stream()
                    .filter(blog -> blog.getStatus() == BlogStatus.ACTIVE)
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new GlobalException("Lỗi khi tìm kiếm blog: " + e.getMessage());
        }
    }

    private Blog convertToEntity(BlogRequest request) {
        return Blog.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .img(request.getImg())
                .build(); // author set riêng trong createBlog()
    }

    private BlogResponse convertToResponse(Blog blog) {
        return BlogResponse.builder()
                .id(blog.getId())
                .title(blog.getTitle())
                .content(blog.getContent())
                .author(blog.getAuthor())
                .img(blog.getImg())
                .status(blog.getStatus())
                .createdAt(blog.getCreatedAt())
                .updatedAt(blog.getUpdatedAt())
                .build();
    }

    // Lấy tất cả blog không lọc trạng thái (dành cho Admin)
    public List<BlogResponse> getAllBlogsForAdmin() {
        User currentUser  = authenticationService.getCurrentUser();
        UserUtil.checkRoleOrThrow(currentUser, "Bạn không có quyền truy cập chức năng này", Role.ADMIN);
        try {
            return blogRepository.findAll().stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new GlobalException("Lỗi khi lấy tất cả blog cho admin: " + e.getMessage());
        }
    }

    public void restoreBlog(Long id) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new GlobalException("Không tìm thấy blog để khôi phục"));
        blog.setStatus(BlogStatus.ACTIVE);
        blog.setUpdatedAt(LocalDateTime.now());
        blogRepository.save(blog);
    }

    public void updateBlogImage(Long id, String imageUrl) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new GlobalException("Không tìm thấy blog để cập nhật ảnh"));
        blog.setImg(imageUrl);
        blog.setUpdatedAt(LocalDateTime.now());
        blogRepository.save(blog);
    }

    public String uploadImage(MultipartFile file) {
        try {
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path uploadPath = Paths.get("uploads");

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/" + fileName;
        } catch (IOException e) {
            throw new GlobalException("Lỗi khi upload ảnh: " + e.getMessage());
        }
    }

    public BlogRatingResponse rateBlog(Long blogId, Long userId, BlogRatingRequest req) {
        Blog blog = blogRepository.findById(blogId)
                .orElseThrow(() -> new GlobalException("Không tìm thấy Blog với id: " + blogId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException("Không tìm thấy User với id: " + userId));

        BlogRating blogRating = BlogRating.builder()
                .blog(blog)
                .user(user)
                .rating(req.getRating())
                .comment(req.getComment())
                .build();
        BlogRating savedBlogRating = blogRatingRepository.save(blogRating);
        return blogRatingMapper.toResponse(savedBlogRating);
    }

    public List<BlogResponse> getBlogsByAuthor(String author) {
        //chỉ admin mới được dùng
        User currentUser  = authenticationService.getCurrentUser();
        UserUtil.checkRoleOrThrow(currentUser, "Bạn không có quyền truy cập chức năng này", Role.ADMIN);
        try {
            return blogRepository.findByAuthorIgnoreCase(author)
                    .stream()
                    .filter(blog -> blog.getStatus() == BlogStatus.ACTIVE)
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new GlobalException("Lỗi khi lấy blog theo tác giả: " + e.getMessage());
        }
    }
}