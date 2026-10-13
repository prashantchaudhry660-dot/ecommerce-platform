package com.cartly.controller;

import com.cartly.config.JwtUtils;
import com.cartly.dto.OrderDtos;
import com.cartly.dto.PageResponse;
import com.cartly.dto.ProductDtos;
import com.cartly.dto.SellerDtos;
import com.cartly.entity.OrderStatus;
import com.cartly.entity.User;
import com.cartly.entity.UserRole;
import com.cartly.exception.ForbiddenException;
import com.cartly.exception.UnauthorizedException;
import com.cartly.repository.UserRepository;
import com.cartly.service.SellerService;
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

import java.util.List;

@RestController
@RequestMapping("/api/seller")
@Tag(name = "Seller Dashboard", description = "Endpoints for seller inventory, catalog, order processing and analytics")
public class SellerController {

    private final SellerService sellerService;
    private final SseNotificationService sseNotificationService;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    public SellerController(
            SellerService sellerService,
            SseNotificationService sseNotificationService,
            JwtUtils jwtUtils,
            UserRepository userRepository
    ) {
        this.sellerService = sellerService;
        this.sseNotificationService = sseNotificationService;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
    }

    // Products & Inventory
    @GetMapping("/products")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "Get current seller product listings")
    public ResponseEntity<PageResponse<ProductDtos.ProductDto>> getProducts(
            @AuthenticationPrincipal User seller,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(sellerService.getSellerProducts(seller, page, size));
    }

    @PostMapping("/products")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "Create a new product listing")
    public ResponseEntity<ProductDtos.ProductDto> createProduct(
            @AuthenticationPrincipal User seller,
            @Valid @RequestBody ProductDtos.ProductCreateRequest request,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        return ResponseEntity.ok(sellerService.createProduct(seller, request, ip));
    }

    @PutMapping("/products/{id}")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "Update an existing product listing")
    public ResponseEntity<ProductDtos.ProductDto> updateProduct(
            @AuthenticationPrincipal User seller,
            @PathVariable Long id,
            @Valid @RequestBody ProductDtos.ProductUpdateRequest request
    ) {
        return ResponseEntity.ok(sellerService.updateProduct(seller, id, request));
    }

    @DeleteMapping("/products/{id}")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "Delete a product listing")
    public ResponseEntity<Void> deleteProduct(
            @AuthenticationPrincipal User seller,
            @PathVariable Long id
    ) {
        sellerService.deleteProduct(seller, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/products/{id}/stock")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "Quick inline stock adjustment")
    public ResponseEntity<ProductDtos.ProductDto> updateStock(
            @AuthenticationPrincipal User seller,
            @PathVariable Long id,
            @Valid @RequestBody ProductDtos.StockUpdateRequest request
    ) {
        return ResponseEntity.ok(sellerService.updateStock(seller, id, request.stock()));
    }

    @GetMapping("/inventory/low-stock")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "Get low stock products based on configurable threshold")
    public ResponseEntity<List<SellerDtos.InventoryAlertDto>> getLowStock(
            @AuthenticationPrincipal User seller,
            @RequestParam(defaultValue = "5") int threshold
    ) {
        return ResponseEntity.ok(sellerService.getLowStockAlerts(seller, threshold));
    }

    // Orders & Kanban Board
    @GetMapping("/orders")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "Get table of orders containing this seller's items")
    public ResponseEntity<PageResponse<OrderDtos.OrderItemDto>> getOrders(
            @AuthenticationPrincipal User seller,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        return ResponseEntity.ok(sellerService.getSellerOrders(seller, page, size));
    }

    @GetMapping("/orders/status/{status}")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "Get items by status for seller Kanban columns")
    public ResponseEntity<List<OrderDtos.OrderItemDto>> getOrdersByStatus(
            @AuthenticationPrincipal User seller,
            @PathVariable OrderStatus status
    ) {
        return ResponseEntity.ok(sellerService.getSellerOrdersByStatus(seller, status));
    }

    @PatchMapping("/orders/items/{itemId}/status")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "Update item status (Confirmed, Packed, Shipped, Delivered) from Kanban or table")
    public ResponseEntity<OrderDtos.OrderItemDto> updateOrderItemStatus(
            @AuthenticationPrincipal User seller,
            @PathVariable Long itemId,
            @Valid @RequestBody OrderDtos.OrderStatusUpdateDto request,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        return ResponseEntity.ok(sellerService.updateOrderItemStatus(seller, itemId, request.status(), request.notes(), ip));
    }

    // Analytics
    @GetMapping("/analytics")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "Get sales analytics, revenue chart, top products and status distribution")
    public ResponseEntity<SellerDtos.SellerAnalyticsDto> getAnalytics(
            @AuthenticationPrincipal User seller,
            @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(sellerService.getSellerAnalytics(seller, days));
    }

    // Realtime SSE Order Stream
    @GetMapping(value = "/sse/order-stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Subscribe to live Server-Sent Events stream for seller order notifications")
    public SseEmitter subscribeOrderStream(
            @RequestParam(required = false) String token,
            @AuthenticationPrincipal User authUser
    ) {
        User seller = authUser;
        if (seller == null && token != null && jwtUtils.validateToken(token)) {
            String email = jwtUtils.extractEmail(token);
            seller = userRepository.findByEmail(email).orElse(null);
        }

        if (seller == null || seller.getRole() != UserRole.SELLER) {
            throw new UnauthorizedException("Valid seller authentication is required for SSE subscription.");
        }

        return sseNotificationService.subscribeSeller(seller.getId());
    }
}
