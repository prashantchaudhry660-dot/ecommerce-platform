package com.cartly.service;

import com.cartly.dto.OrderDtos;
import com.cartly.dto.PageResponse;
import com.cartly.dto.ProductDtos;
import com.cartly.dto.SellerDtos;
import com.cartly.entity.*;
import com.cartly.exception.BadRequestException;
import com.cartly.exception.ForbiddenException;
import com.cartly.exception.ResourceNotFoundException;
import com.cartly.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class SellerService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final ActivityLogService activityLogService;
    private final SseNotificationService sseNotificationService;
    private final ProductService productService;

    public SellerService(
            ProductRepository productRepository,
            ProductImageRepository productImageRepository,
            OrderItemRepository orderItemRepository,
            OrderRepository orderRepository,
            OrderStatusHistoryRepository orderStatusHistoryRepository,
            ActivityLogService activityLogService,
            SseNotificationService sseNotificationService,
            ProductService productService
    ) {
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderRepository = orderRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.activityLogService = activityLogService;
        this.sseNotificationService = sseNotificationService;
        this.productService = productService;
    }

    @Transactional
    public ProductDtos.ProductDto createProduct(User seller, ProductDtos.ProductCreateRequest request, String ipAddress) {
        String baseSlug = request.name().trim().toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");

        String slug = baseSlug;
        int counter = 1;
        while (productRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter++;
        }

        if (productRepository.existsBySku(request.sku())) {
            throw new BadRequestException("A product with SKU '" + request.sku() + "' already exists.");
        }

        Product product = new Product();
        product.setSeller(seller);
        product.setName(request.name().trim());
        product.setSlug(slug);
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setOriginalPrice(request.originalPrice());
        product.setCategory(request.category().trim());
        product.setSku(request.sku().trim());
        product.setStock(request.stock());
        product.setModerationStatus(ProductModerationStatus.APPROVED);
        product.setSpecifications(request.specifications());

        if (request.imageUrls() != null && !request.imageUrls().isEmpty()) {
            for (int i = 0; i < request.imageUrls().size(); i++) {
                String url = request.imageUrls().get(i);
                if (url != null && !url.isBlank()) {
                    product.addImage(new ProductImage(url.trim(), i == 0, i));
                }
            }
        }

        Product saved = productRepository.save(product);

        activityLogService.log(
                seller.getId(),
                seller.getEmail(),
                "PRODUCT_LISTED",
                "PRODUCT",
                saved.getId(),
                "Seller " + seller.getFullName() + " listed product: " + saved.getName(),
                ipAddress
        );

        return productService.toDto(saved);
    }

    @Transactional
    public ProductDtos.ProductDto updateProduct(User seller, Long productId, ProductDtos.ProductUpdateRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!product.getSeller().getId().equals(seller.getId())) {
            throw new ForbiddenException("You do not have permission to modify this product.");
        }

        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setOriginalPrice(request.originalPrice());
        product.setCategory(request.category().trim());
        product.setStock(request.stock());
        product.setSpecifications(request.specifications());

        if (request.imageUrls() != null && !request.imageUrls().isEmpty()) {
            product.getImages().clear();
            for (int i = 0; i < request.imageUrls().size(); i++) {
                String url = request.imageUrls().get(i);
                if (url != null && !url.isBlank()) {
                    product.addImage(new ProductImage(url.trim(), i == 0, i));
                }
            }
        }

        Product saved = productRepository.save(product);
        return productService.toDto(saved);
    }

    @Transactional
    public void deleteProduct(User seller, Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!product.getSeller().getId().equals(seller.getId())) {
            throw new ForbiddenException("You do not have permission to delete this product.");
        }

        productRepository.delete(product);
    }

    @Transactional
    public ProductDtos.ProductDto updateStock(User seller, Long productId, Integer newStock) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!product.getSeller().getId().equals(seller.getId())) {
            throw new ForbiddenException("You do not have permission to update stock for this product.");
        }

        product.setStock(newStock);
        Product saved = productRepository.save(product);
        return productService.toDto(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductDtos.ProductDto> getSellerProducts(User seller, int page, int size) {
        Page<Product> p = productRepository.findBySellerId(seller.getId(), PageRequest.of(page, size));
        return PageResponse.from(p.map(productService::toDto));
    }

    @Transactional(readOnly = true)
    public List<SellerDtos.InventoryAlertDto> getLowStockAlerts(User seller, Integer threshold) {
        int th = threshold != null ? threshold : 5;
        List<Product> list = productRepository.findLowStockProducts(seller.getId(), th);
        return list.stream().map(p -> new SellerDtos.InventoryAlertDto(
                p.getId(),
                p.getName(),
                p.getSku(),
                p.getStock(),
                p.getCategory(),
                p.getImages() != null && !p.getImages().isEmpty() ? p.getImages().get(0).getImageUrl() : null
        )).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderDtos.OrderItemDto> getSellerOrders(User seller, int page, int size) {
        Page<OrderItem> p = orderItemRepository.findBySellerId(seller.getId(), PageRequest.of(page, size));
        return PageResponse.from(p.map(item -> new OrderDtos.OrderItemDto(
                item.getId(),
                item.getOrder().getId(),
                item.getOrder().getOrderNumber(),
                item.getProduct().getId(),
                seller.getId(),
                seller.getFullName(),
                item.getProductName(),
                item.getProductImage(),
                item.getUnitPrice(),
                item.getQuantity(),
                item.getSubtotal(),
                item.getItemStatus(),
                item.getCreatedAt()
        )));
    }

    @Transactional(readOnly = true)
    public List<OrderDtos.OrderItemDto> getSellerOrdersByStatus(User seller, OrderStatus status) {
        List<OrderItem> items = orderItemRepository.findBySellerIdAndStatus(seller.getId(), status);
        return items.stream().map(item -> new OrderDtos.OrderItemDto(
                item.getId(),
                item.getOrder().getId(),
                item.getOrder().getOrderNumber(),
                item.getProduct().getId(),
                seller.getId(),
                seller.getFullName(),
                item.getProductName(),
                item.getProductImage(),
                item.getUnitPrice(),
                item.getQuantity(),
                item.getSubtotal(),
                item.getItemStatus(),
                item.getCreatedAt()
        )).toList();
    }

    @Transactional
    public OrderDtos.OrderItemDto updateOrderItemStatus(
            User seller,
            Long itemId,
            OrderStatus newStatus,
            String notes,
            String ipAddress
    ) {
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found"));

        if (!item.getSeller().getId().equals(seller.getId())) {
            throw new ForbiddenException("You can only modify order items belonging to your store.");
        }

        OrderStatus oldStatus = item.getItemStatus();
        item.setItemStatus(newStatus);
        OrderItem savedItem = orderItemRepository.save(item);

        // Derive and update overall parent order status!
        Order order = item.getOrder();
        OrderStatus newOverall = OrderService.deriveOverallStatus(order.getItems());
        order.setOverallStatus(newOverall);
        orderRepository.save(order);

        // Record history
        String noteMsg = (notes != null && !notes.isBlank()) ? notes : "Status updated to " + newStatus;
        OrderStatusHistory history = new OrderStatusHistory(
                order,
                item,
                newStatus.name(),
                noteMsg + " (by Seller: " + seller.getFullName() + ")",
                seller
        );
        orderStatusHistoryRepository.save(history);

        // Log Activity
        activityLogService.log(
                seller.getId(),
                seller.getEmail(),
                "ORDER_STATUS_CHANGED",
                "ORDER_ITEM",
                item.getId(),
                String.format("Item '%s' (Order %s) changed from %s to %s",
                        item.getProductName(), order.getOrderNumber(), oldStatus, newStatus),
                ipAddress
        );

        OrderDtos.OrderItemDto dto = new OrderDtos.OrderItemDto(
                savedItem.getId(),
                order.getId(),
                order.getOrderNumber(),
                savedItem.getProduct().getId(),
                seller.getId(),
                seller.getFullName(),
                savedItem.getProductName(),
                savedItem.getProductImage(),
                savedItem.getUnitPrice(),
                savedItem.getQuantity(),
                savedItem.getSubtotal(),
                savedItem.getItemStatus(),
                savedItem.getCreatedAt()
        );

        // Broadcast to Admin and Seller SSE
        sseNotificationService.broadcastToAdmin("ITEM_STATUS_UPDATED", dto);
        sseNotificationService.notifySeller(seller.getId(), "ITEM_STATUS_UPDATED", dto);

        return dto;
    }

    @Transactional(readOnly = true)
    public SellerDtos.SellerAnalyticsDto getSellerAnalytics(User seller, int days) {
        int filterDays = days > 0 ? days : 30;
        LocalDateTime startDate = LocalDateTime.now().minusDays(filterDays);

        BigDecimal totalRevenue = orderItemRepository.calculateSellerTotalRevenue(seller.getId());
        long totalOrders = orderItemRepository.countDistinctOrdersForSeller(seller.getId());
        long totalProducts = productRepository.countBySellerId(seller.getId());

        // Daily sales chart
        List<Object[]> dailySalesRows = orderItemRepository.getSellerDailySales(seller.getId(), startDate);
        List<SellerDtos.DailySalesPoint> salesChart = new ArrayList<>();
        for (Object[] row : dailySalesRows) {
            String day = String.valueOf(row[0]);
            BigDecimal rev = (BigDecimal) row[1];
            long count = ((Number) row[2]).longValue();
            salesChart.add(new SellerDtos.DailySalesPoint(day, rev, count));
        }

        // Top products
        List<Object[]> topProdRows = orderItemRepository.findTopSellingProductsBySeller(seller.getId(), PageRequest.of(0, 5));
        List<SellerDtos.TopProductDto> topProducts = new ArrayList<>();
        for (Object[] row : topProdRows) {
            String prodName = (String) row[0];
            long units = ((Number) row[1]).longValue();
            BigDecimal rev = (BigDecimal) row[2];
            String img = (String) row[3];
            topProducts.add(new SellerDtos.TopProductDto(prodName, units, rev, img));
        }

        // Orders by status donut
        List<Object[]> statusRows = orderItemRepository.countOrdersByStatusForSeller(seller.getId());
        List<SellerDtos.StatusCountDto> ordersByStatus = new ArrayList<>();
        for (Object[] row : statusRows) {
            OrderStatus st = (OrderStatus) row[0];
            long cnt = ((Number) row[1]).longValue();
            ordersByStatus.add(new SellerDtos.StatusCountDto(st, cnt));
        }

        return new SellerDtos.SellerAnalyticsDto(
                totalRevenue,
                totalOrders,
                totalProducts,
                salesChart,
                topProducts,
                ordersByStatus
        );
    }
}
