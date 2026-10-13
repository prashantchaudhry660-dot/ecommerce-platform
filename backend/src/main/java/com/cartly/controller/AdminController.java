package com.cartly.controller;

import com.cartly.config.JwtUtils;
import com.cartly.dto.AdminDtos;
import com.cartly.dto.AuthDtos;
import com.cartly.dto.OrderDtos;
import com.cartly.dto.PageResponse;
import com.cartly.dto.ProductDtos;
import com.cartly.entity.OrderStatus;
import com.cartly.entity.ProductModerationStatus;
import com.cartly.entity.User;
import com.cartly.entity.UserRole;
import com.cartly.exception.UnauthorizedException;
import com.cartly.repository.UserRepository;
import com.cartly.service.ActivityLogService;
import com.cartly.service.AdminService;
import com.cartly.service.SseNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin Governance", description = "Endpoints for platform administration, user management, moderation and realtime activity feed")
public class AdminController {

    private final AdminService adminService;
    private final ActivityLogService activityLogService;
    private final SseNotificationService sseNotificationService;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    public AdminController(
            AdminService adminService,
            ActivityLogService activityLogService,
            SseNotificationService sseNotificationService,
            JwtUtils jwtUtils,
            UserRepository userRepository
    ) {
        this.adminService = adminService;
        this.activityLogService = activityLogService;
        this.sseNotificationService = sseNotificationService;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
    }

    // 1. User Management
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get paginated platform users with search and role filters")
    public ResponseEntity<PageResponse<AuthDtos.UserDto>> getUsers(
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        return ResponseEntity.ok(adminService.getUsers(role, search, page, size));
    }

    @PatchMapping("/users/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Suspend or activate a user account")
    public ResponseEntity<AuthDtos.UserDto> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminDtos.UserUpdateStatusRequest request,
            @AuthenticationPrincipal User admin,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        return ResponseEntity.ok(adminService.updateUserStatus(id, request.status(), admin, ip));
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Edit user profile details (name, email, role)")
    public ResponseEntity<AuthDtos.UserDto> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody AdminDtos.UserUpdateRequest request,
            @AuthenticationPrincipal User admin,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        return ResponseEntity.ok(adminService.updateUser(id, request, admin, ip));
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete user account")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        adminService.deleteUser(id, admin, ip);
        return ResponseEntity.noContent().build();
    }

    // 2. Product Management & Moderation
    @GetMapping("/products")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all platform products with moderation status and search")
    public ResponseEntity<PageResponse<ProductDtos.ProductDto>> getAllProducts(
            @RequestParam(required = false) ProductModerationStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        return ResponseEntity.ok(adminService.getAllProducts(status, search, page, size));
    }

    @PatchMapping("/products/{id}/moderate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update product moderation status (APPROVED, FLAGGED, REMOVED) with reason")
    public ResponseEntity<ProductDtos.ProductDto> moderateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductDtos.ModerationRequest request,
            @AuthenticationPrincipal User admin,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        return ResponseEntity.ok(adminService.moderateProduct(id, request, admin, ip));
    }

    // 3. Platform Order Management
    @GetMapping("/orders")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all platform orders with status filter and search")
    public ResponseEntity<PageResponse<OrderDtos.OrderResponseDto>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        return ResponseEntity.ok(adminService.getAllOrders(status, search, page, size));
    }

    @PatchMapping("/orders/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Override platform order status")
    public ResponseEntity<OrderDtos.OrderResponseDto> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderDtos.OrderStatusUpdateDto request,
            @AuthenticationPrincipal User admin,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        return ResponseEntity.ok(adminService.updateOrderStatus(id, request, admin, ip));
    }

    // 4. Metrics & KPIs
    @GetMapping("/metrics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get platform KPI cards (GMV, orders today, sellers, users) and sparklines")
    public ResponseEntity<AdminDtos.AdminMetricsDto> getMetrics() {
        return ResponseEntity.ok(adminService.getPlatformMetrics());
    }

    // 5. Activity Log Table
    @GetMapping("/activity")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get paginated platform activity logs")
    public ResponseEntity<PageResponse<AdminDtos.ActivityLogDto>> getActivity(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(activityLogService.getActivityLogs(page, size));
    }

    // 6. Realtime SSE System Feed
    @GetMapping(value = "/sse/activity-stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Subscribe to live Server-Sent Events stream for platform activity monitoring")
    public SseEmitter subscribeActivityStream(
            @RequestParam(required = false) String token,
            @AuthenticationPrincipal User authUser
    ) {
        User admin = authUser;
        if (admin == null && token != null && jwtUtils.validateToken(token)) {
            String email = jwtUtils.extractEmail(token);
            admin = userRepository.findByEmail(email).orElse(null);
        }

        if (admin == null || admin.getRole() != UserRole.ADMIN) {
            throw new UnauthorizedException("Valid admin authentication is required for SSE subscription.");
        }

        return sseNotificationService.subscribeAdmin();
    }
}
