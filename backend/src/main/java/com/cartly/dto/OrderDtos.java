package com.cartly.dto;

import com.cartly.entity.OrderStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderDtos {

    public record CheckoutItemRequest(
            @NotNull(message = "Product ID is required")
            Long productId,

            @NotNull(message = "Quantity is required")
            @Min(value = 1, message = "Quantity must be at least 1")
            Integer quantity
    ) {}

    public record CheckoutRequest(
            @NotEmpty(message = "Items list cannot be empty")
            List<CheckoutItemRequest> items,

            Long addressId,

            BuyerDtos.AddressCreateRequest newAddress,

            @NotNull(message = "Payment method is required")
            String paymentMethod
    ) {}

    public record OrderItemDto(
            Long id,
            Long orderId,
            String orderNumber,
            Long productId,
            Long sellerId,
            String sellerName,
            String productName,
            String productImage,
            BigDecimal unitPrice,
            Integer quantity,
            BigDecimal subtotal,
            OrderStatus itemStatus,
            LocalDateTime createdAt
    ) {}

    public record OrderStatusHistoryDto(
            Long id,
            Long orderId,
            Long orderItemId,
            String status,
            String notes,
            String changedByName,
            LocalDateTime createdAt
    ) {}

    public record OrderResponseDto(
            Long id,
            String orderNumber,
            Long buyerId,
            String buyerName,
            String buyerEmail,
            BigDecimal totalAmount,
            BigDecimal shippingAmount,
            String paymentMethod,
            String paymentStatus,
            OrderStatus overallStatus,
            BuyerDtos.AddressDto shippingAddress,
            List<OrderItemDto> items,
            List<OrderStatusHistoryDto> statusHistories,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {}

    public record OrderStatusUpdateDto(
            @NotNull(message = "Status is required")
            OrderStatus status,

            String notes
    ) {}
}
