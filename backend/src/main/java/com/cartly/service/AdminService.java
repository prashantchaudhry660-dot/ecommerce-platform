package com.cartly.service;

import com.cartly.dto.AdminDtos;
import com.cartly.dto.AuthDtos;
import com.cartly.dto.OrderDtos;
import com.cartly.dto.PageResponse;
import com.cartly.dto.ProductDtos;
import com.cartly.dto.SellerDtos;
import com.cartly.entity.*;
import com.cartly.exception.BadRequestException;
import com.cartly.exception.ResourceNotFoundException;
import com.cartly.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final ActivityLogService activityLogService;
    private final SseNotificationService sseNotificationService;
    private final ProductService productService;
    private final OrderService orderService;

    public AdminService(
            UserRepository userRepository,
            ProductRepository productRepository,
            OrderRepository orderRepository,
            OrderStatusHistoryRepository orderStatusHistoryRepository,
            ActivityLogService activityLogService,
            SseNotificationService sseNotificationService,
            ProductService productService,
            OrderService orderService
    ) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.activityLogService = activityLogService;
        this.sseNotificationService = sseNotificationService;
        this.productService = productService;
        this.orderService = orderService;
    }

    // 1. User Management
    @Transactional(readOnly = true)
    public PageResponse<AuthDtos.UserDto> getUsers(UserRole role, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> users = userRepository.searchUsers(role, search, pageable);
        return PageResponse.from(users.map(u -> new AuthDtos.UserDto(
                u.getId(),
                u.getEmail(),
                u.getFullName(),
                u.getRole(),
                u.getStatus(),
                u.getCreatedAt()
        )));
    }

    @Transactional
    public AuthDtos.UserDto updateUserStatus(Long userId, UserStatus status, User admin, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getId().equals(admin.getId())) {
            throw new BadRequestException("Admin cannot suspend their own account.");
        }

        user.setStatus(status);
        User saved = userRepository.save(user);

        activityLogService.log(
                admin.getId(),
                admin.getEmail(),
                "USER_STATUS_UPDATED",
                "USER",
                user.getId(),
                String.format("User %s status changed to %s", user.getEmail(), status),
                ipAddress
        );

        return new AuthDtos.UserDto(
                saved.getId(),
                saved.getEmail(),
                saved.getFullName(),
                saved.getRole(),
                saved.getStatus(),
                saved.getCreatedAt()
        );
    }

    @Transactional
    public AuthDtos.UserDto updateUser(Long userId, AdminDtos.UserUpdateRequest request, User admin, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }
        if (request.email() != null && !request.email().isBlank() && !request.email().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(request.email().trim().toLowerCase())) {
                throw new BadRequestException("Email is already taken by another user.");
            }
            user.setEmail(request.email().trim().toLowerCase());
        }
        if (request.role() != null) {
            user.setRole(request.role());
        }

        User saved = userRepository.save(user);

        activityLogService.log(
                admin.getId(),
                admin.getEmail(),
                "USER_EDITED",
                "USER",
                user.getId(),
                "Admin edited profile for user " + saved.getEmail(),
                ipAddress
        );

        return new AuthDtos.UserDto(
                saved.getId(),
                saved.getEmail(),
                saved.getFullName(),
                saved.getRole(),
                saved.getStatus(),
                saved.getCreatedAt()
        );
    }

    @Transactional
    public void deleteUser(Long userId, User admin, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getId().equals(admin.getId())) {
            throw new BadRequestException("Admin cannot delete own account.");
        }

        activityLogService.log(
                admin.getId(),
                admin.getEmail(),
                "USER_DELETED",
                "USER",
                user.getId(),
                "Admin deleted user " + user.getEmail(),
                ipAddress
        );

        userRepository.delete(user);
    }

    // 2. Product Management & Moderation
    @Transactional(readOnly = true)
    public PageResponse<ProductDtos.ProductDto> getAllProducts(ProductModerationStatus status, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Product> p = productRepository.searchAllForAdmin(status, search, pageable);
        return PageResponse.from(p.map(productService::toDto));
    }

    @Transactional
    public ProductDtos.ProductDto moderateProduct(Long productId, ProductDtos.ModerationRequest request, User admin, String ipAddress) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        product.setModerationStatus(request.status());
        product.setModerationReason(request.reason());
        Product saved = productRepository.save(product);

        activityLogService.log(
                admin.getId(),
                admin.getEmail(),
                "PRODUCT_MODERATED",
                "PRODUCT",
                saved.getId(),
                String.format("Product '%s' moderated to %s: %s", saved.getName(), request.status(), request.reason()),
                ipAddress
        );

        ProductDtos.ProductDto dto = productService.toDto(saved);
        sseNotificationService.broadcastToAdmin("PRODUCT_MODERATED", dto);

        return dto;
    }

    // 3. Platform Order Management
    @Transactional(readOnly = true)
    public PageResponse<OrderDtos.OrderResponseDto> getAllOrders(OrderStatus status, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> p = orderRepository.searchOrdersAdmin(status, search, pageable);
        return PageResponse.from(p.map(orderService::toResponseDto));
    }

    @Transactional
    public OrderDtos.OrderResponseDto updateOrderStatus(Long orderId, OrderDtos.OrderStatusUpdateDto request, User admin, String ipAddress) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        OrderStatus oldStatus = order.getOverallStatus();
        order.setOverallStatus(request.status());

        // Update all order items to match override status
        for (OrderItem item : order.getItems()) {
            item.setItemStatus(request.status());
        }

        Order saved = orderRepository.save(order);

        OrderStatusHistory history = new OrderStatusHistory(
                saved,
                null,
                request.status().name(),
                (request.notes() != null ? request.notes() : "Admin status override") + " (Admin: " + admin.getFullName() + ")",
                admin
        );
        orderStatusHistoryRepository.save(history);
        saved.getStatusHistories().add(history);

        activityLogService.log(
                admin.getId(),
                admin.getEmail(),
                "ORDER_STATUS_OVERRIDE",
                "ORDER",
                saved.getId(),
                String.format("Order %s status changed from %s to %s by admin", saved.getOrderNumber(), oldStatus, request.status()),
                ipAddress
        );

        OrderDtos.OrderResponseDto dto = orderService.toResponseDto(saved);
        sseNotificationService.broadcastToAdmin("ORDER_UPDATED", dto);

        return dto;
    }

    // 4. Metrics & KPIs
    @Transactional(readOnly = true)
    public AdminDtos.AdminMetricsDto getPlatformMetrics() {
        BigDecimal gmv = orderRepository.calculatePlatformGmv();
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        long ordersToday = orderRepository.countOrdersSince(startOfToday);
        long totalUsers = userRepository.count();
        long totalSellers = userRepository.countByRole(UserRole.SELLER);
        long totalProducts = productRepository.count();

        // 7-day sparklines
        LocalDateTime sevenDaysAgo = LocalDate.now().minusDays(7).atStartOfDay();
        List<Object[]> dailyRows = orderRepository.getDailyPlatformMetrics(sevenDaysAgo);
        List<AdminDtos.SparklinePoint> trend = new ArrayList<>();
        for (Object[] r : dailyRows) {
            String day = String.valueOf(r[0]);
            BigDecimal dayGmv = (BigDecimal) r[1];
            long count = ((Number) r[2]).longValue();
            trend.add(new AdminDtos.SparklinePoint(day, dayGmv, count));
        }

        // Status breakdown
        List<SellerDtos.StatusCountDto> ordersByStatus = Arrays.stream(OrderStatus.values()).map(st -> {
            long c = orderRepository.searchOrdersAdmin(st, null, PageRequest.of(0, 1)).getTotalElements();
            return new SellerDtos.StatusCountDto(st, c);
        }).toList();

        return new AdminDtos.AdminMetricsDto(
                gmv,
                ordersToday,
                totalUsers,
                totalSellers,
                totalProducts,
                trend,
                ordersByStatus
        );
    }
}
