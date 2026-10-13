package com.cartly.dto;

import com.cartly.entity.UserRole;
import com.cartly.entity.UserStatus;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class AdminDtos {

    public record SparklinePoint(
            String date,
            BigDecimal value,
            long count
    ) {}

    public record AdminMetricsDto(
            BigDecimal gmv,
            long ordersToday,
            long totalUsers,
            long totalSellers,
            long totalProducts,
            List<SparklinePoint> gmvTrend,
            List<SellerDtos.StatusCountDto> platformOrdersByStatus
    ) {}

    public record ActivityLogDto(
            Long id,
            Long userId,
            String userEmail,
            String action,
            String entityType,
            Long entityId,
            String details,
            String ipAddress,
            LocalDateTime createdAt
    ) {}

    public record UserUpdateStatusRequest(
            @NotNull(message = "Status is required")
            UserStatus status
    ) {}

    public record UserUpdateRequest(
            String fullName,
            String email,
            UserRole role
    ) {}
}
