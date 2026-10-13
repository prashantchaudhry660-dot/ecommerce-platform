package com.cartly.dto;

import com.cartly.entity.OrderStatus;

import java.math.BigDecimal;
import java.util.List;

public class SellerDtos {

    public record DailySalesPoint(
            String date,
            BigDecimal revenue,
            long orders
    ) {}

    public record TopProductDto(
            String productName,
            long unitsSold,
            BigDecimal totalRevenue,
            String productImage
    ) {}

    public record StatusCountDto(
            OrderStatus status,
            long count
    ) {}

    public record InventoryAlertDto(
            Long productId,
            String productName,
            String sku,
            Integer stock,
            String category,
            String image
    ) {}

    public record SellerAnalyticsDto(
            BigDecimal totalRevenue,
            long totalOrders,
            long totalProducts,
            List<DailySalesPoint> salesChart,
            List<TopProductDto> topProducts,
            List<StatusCountDto> ordersByStatus
    ) {}
}
