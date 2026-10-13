package com.cartly.controller;

import com.cartly.dto.BuyerDtos;
import com.cartly.dto.OrderDtos;
import com.cartly.dto.PageResponse;
import com.cartly.entity.User;
import com.cartly.service.BuyerService;
import com.cartly.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buyer")
@PreAuthorize("hasRole('BUYER')")
@Tag(name = "Buyer Experience", description = "Endpoints for buyer checkout, order tracking, addresses and wishlist")
public class BuyerController {

    private final OrderService orderService;
    private final BuyerService buyerService;

    public BuyerController(OrderService orderService, BuyerService buyerService) {
        this.orderService = orderService;
        this.buyerService = buyerService;
    }

    // Checkout & Orders
    @PostMapping("/checkout")
    @Operation(summary = "Perform concurrency-safe multi-vendor checkout with atomic stock deduction")
    public ResponseEntity<OrderDtos.OrderResponseDto> checkout(
            @AuthenticationPrincipal User buyer,
            @Valid @RequestBody OrderDtos.CheckoutRequest request,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        return ResponseEntity.ok(orderService.checkout(buyer, request, ip));
    }

    @GetMapping("/orders")
    @Operation(summary = "Get current buyer order history with item statuses")
    public ResponseEntity<PageResponse<OrderDtos.OrderResponseDto>> getOrders(
            @AuthenticationPrincipal User buyer,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(orderService.getBuyerOrders(buyer, page, size));
    }

    @GetMapping("/orders/{id}")
    @Operation(summary = "Get order details and full animated tracking timeline")
    public ResponseEntity<OrderDtos.OrderResponseDto> getOrderDetails(
            @PathVariable Long id,
            @AuthenticationPrincipal User buyer
    ) {
        return ResponseEntity.ok(orderService.getOrderDetails(id, buyer));
    }

    // Address Book
    @GetMapping("/addresses")
    @Operation(summary = "Get buyer address book")
    public ResponseEntity<List<BuyerDtos.AddressDto>> getAddresses(@AuthenticationPrincipal User buyer) {
        return ResponseEntity.ok(buyerService.getAddresses(buyer));
    }

    @PostMapping("/addresses")
    @Operation(summary = "Add a new address to address book")
    public ResponseEntity<BuyerDtos.AddressDto> createAddress(
            @AuthenticationPrincipal User buyer,
            @Valid @RequestBody BuyerDtos.AddressCreateRequest request
    ) {
        return ResponseEntity.ok(buyerService.createAddress(buyer, request));
    }

    @DeleteMapping("/addresses/{id}")
    @Operation(summary = "Delete an address")
    public ResponseEntity<Void> deleteAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal User buyer
    ) {
        buyerService.deleteAddress(buyer, id);
        return ResponseEntity.noContent().build();
    }

    // Saved Payment Methods
    @GetMapping("/payment-methods")
    @Operation(summary = "Get saved payment methods (masked last4)")
    public ResponseEntity<List<BuyerDtos.PaymentMethodDto>> getPaymentMethods(@AuthenticationPrincipal User buyer) {
        return ResponseEntity.ok(buyerService.getPaymentMethods(buyer));
    }

    @PostMapping("/payment-methods")
    @Operation(summary = "Save a masked payment method")
    public ResponseEntity<BuyerDtos.PaymentMethodDto> createPaymentMethod(
            @AuthenticationPrincipal User buyer,
            @Valid @RequestBody BuyerDtos.PaymentMethodCreateRequest request
    ) {
        return ResponseEntity.ok(buyerService.createPaymentMethod(buyer, request));
    }

    // Wishlist with Price Drop Badge
    @GetMapping("/wishlist")
    @Operation(summary = "Get buyer wishlist items with price-drop indicators")
    public ResponseEntity<List<BuyerDtos.WishlistResponseDto>> getWishlist(@AuthenticationPrincipal User buyer) {
        return ResponseEntity.ok(buyerService.getWishlist(buyer));
    }

    @PostMapping("/wishlist/{productId}")
    @Operation(summary = "Add product to wishlist")
    public ResponseEntity<Void> addToWishlist(
            @PathVariable Long productId,
            @AuthenticationPrincipal User buyer
    ) {
        buyerService.addToWishlist(buyer, productId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/wishlist/{productId}")
    @Operation(summary = "Remove product from wishlist")
    public ResponseEntity<Void> removeFromWishlist(
            @PathVariable Long productId,
            @AuthenticationPrincipal User buyer
    ) {
        buyerService.removeFromWishlist(buyer, productId);
        return ResponseEntity.noContent().build();
    }

    // Recently Viewed
    @GetMapping("/recently-viewed")
    @Operation(summary = "Get recently viewed products tracked on the server")
    public ResponseEntity<List<BuyerDtos.RecentlyViewedDto>> getRecentlyViewed(
            @AuthenticationPrincipal User buyer,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(buyerService.getRecentlyViewed(buyer, limit));
    }
}
