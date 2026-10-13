package com.cartly.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BuyerDtos {

    public record AddressCreateRequest(
            @NotBlank(message = "Full name is required")
            String fullName,

            @NotBlank(message = "Phone number is required")
            String phone,

            @NotBlank(message = "Address line 1 is required")
            String addressLine1,

            String addressLine2,

            @NotBlank(message = "City is required")
            String city,

            @NotBlank(message = "State is required")
            String state,

            @NotBlank(message = "Postal code is required")
            String postalCode,

            String country,

            Boolean isDefault
    ) {}

    public record AddressDto(
            Long id,
            String fullName,
            String phone,
            String addressLine1,
            String addressLine2,
            String city,
            String state,
            String postalCode,
            String country,
            Boolean isDefault
    ) {}

    public record PaymentMethodCreateRequest(
            @NotBlank(message = "Provider is required")
            String provider,

            @NotBlank(message = "Card type is required")
            String cardType,

            @NotBlank(message = "Masked number or last4 is required")
            String maskedNumber,

            @NotNull(message = "Expiry month is required")
            Integer expiryMonth,

            @NotNull(message = "Expiry year is required")
            Integer expiryYear,

            Boolean isDefault
    ) {}

    public record PaymentMethodDto(
            Long id,
            String provider,
            String cardType,
            String maskedNumber,
            Integer expiryMonth,
            Integer expiryYear,
            Boolean isDefault
    ) {}

    public record WishlistResponseDto(
            Long id,
            Long productId,
            String productName,
            String productSlug,
            String productImage,
            BigDecimal currentPrice,
            BigDecimal priceAtAdd,
            boolean hasPriceDropped,
            BigDecimal priceDropAmount,
            Integer stock,
            String category
    ) {}

    public record RecentlyViewedDto(
            Long id,
            Long productId,
            String productName,
            String productSlug,
            String productImage,
            BigDecimal price,
            String category,
            LocalDateTime viewedAt
    ) {}
}
