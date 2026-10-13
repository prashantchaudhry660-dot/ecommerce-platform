package com.cartly.dto;

import com.cartly.entity.ProductModerationStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ProductDtos {

    public record ProductCreateRequest(
            @NotBlank(message = "Product name is required")
            String name,

            String description,

            @NotNull(message = "Price is required")
            @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than zero")
            BigDecimal price,

            @NotNull(message = "Original price is required")
            @DecimalMin(value = "0.0", inclusive = false, message = "Original price must be greater than zero")
            BigDecimal originalPrice,

            @NotBlank(message = "Category is required")
            String category,

            @NotBlank(message = "SKU is required")
            String sku,

            @NotNull(message = "Stock is required")
            @Min(value = 0, message = "Stock cannot be negative")
            Integer stock,

            List<String> imageUrls,

            String specifications
    ) {}

    public record ProductUpdateRequest(
            @NotBlank(message = "Product name is required")
            String name,

            String description,

            @NotNull(message = "Price is required")
            @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than zero")
            BigDecimal price,

            @NotNull(message = "Original price is required")
            @DecimalMin(value = "0.0", inclusive = false, message = "Original price must be greater than zero")
            BigDecimal originalPrice,

            @NotBlank(message = "Category is required")
            String category,

            @NotNull(message = "Stock is required")
            @Min(value = 0, message = "Stock cannot be negative")
            Integer stock,

            List<String> imageUrls,

            String specifications
    ) {}

    public record StockUpdateRequest(
            @NotNull(message = "Stock is required")
            @Min(value = 0, message = "Stock cannot be negative")
            Integer stock
    ) {}

    public record ModerationRequest(
            @NotNull(message = "Moderation status is required")
            ProductModerationStatus status,

            String reason
    ) {}

    public record ProductDto(
            Long id,
            Long sellerId,
            String sellerName,
            String name,
            String slug,
            String description,
            BigDecimal price,
            BigDecimal originalPrice,
            String category,
            String sku,
            Integer stock,
            ProductModerationStatus moderationStatus,
            String moderationReason,
            String specifications,
            List<String> images,
            String primaryImage,
            String secondaryImage,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {}

    public record ProductSummaryDto(
            Long id,
            String name,
            String slug,
            BigDecimal price,
            BigDecimal originalPrice,
            String category,
            Integer stock,
            String primaryImage,
            String secondaryImage,
            ProductModerationStatus moderationStatus
    ) {}
}
