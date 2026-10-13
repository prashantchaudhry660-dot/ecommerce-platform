package com.cartly.service;

import com.cartly.dto.BuyerDtos;
import com.cartly.dto.OrderDtos;
import com.cartly.dto.PageResponse;
import com.cartly.entity.*;
import com.cartly.exception.BadRequestException;
import com.cartly.exception.ForbiddenException;
import com.cartly.exception.InsufficientStockException;
import com.cartly.exception.ResourceNotFoundException;
import com.cartly.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final ProductRepository productRepository;
    private final AddressRepository addressRepository;
    private final ActivityLogService activityLogService;
    private final SseNotificationService sseNotificationService;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            OrderStatusHistoryRepository orderStatusHistoryRepository,
            ProductRepository productRepository,
            AddressRepository addressRepository,
            ActivityLogService activityLogService,
            SseNotificationService sseNotificationService
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.productRepository = productRepository;
        this.addressRepository = addressRepository;
        this.activityLogService = activityLogService;
        this.sseNotificationService = sseNotificationService;
    }

    /**
     * Executes atomic multi-vendor checkout with pessimistic/conditional stock locking.
     * Prevents overselling and rolls back if any product has insufficient stock.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public OrderDtos.OrderResponseDto checkout(User buyer, OrderDtos.CheckoutRequest request, String ipAddress) {
        if (request.items() == null || request.items().isEmpty()) {
            throw new BadRequestException("Checkout items cannot be empty.");
        }

        // 1. Resolve Shipping Address
        Address address;
        if (request.addressId() != null) {
            address = addressRepository.findById(request.addressId())
                    .orElseThrow(() -> new ResourceNotFoundException("Shipping address not found"));
            if (!address.getUser().getId().equals(buyer.getId())) {
                throw new ForbiddenException("Unauthorized access to specified address");
            }
        } else if (request.newAddress() != null) {
            BuyerDtos.AddressCreateRequest newAddrReq = request.newAddress();
            address = new Address();
            address.setUser(buyer);
            address.setFullName(newAddrReq.fullName());
            address.setPhone(newAddrReq.phone());
            address.setAddressLine1(newAddrReq.addressLine1());
            address.setAddressLine2(newAddrReq.addressLine2());
            address.setCity(newAddrReq.city());
            address.setState(newAddrReq.state());
            address.setPostalCode(newAddrReq.postalCode());
            address.setCountry(newAddrReq.country() != null ? newAddrReq.country() : "India");
            address.setIsDefault(newAddrReq.isDefault() != null ? newAddrReq.isDefault() : false);
            address = addressRepository.save(address);
        } else {
            address = addressRepository.findByUserIdAndIsDefaultTrue(buyer.getId())
                    .orElseThrow(() -> new BadRequestException("Please provide a shipping address."));
        }

        // 2. Concurrency-Safe Atomic Stock Decrement & Item Preparation
        String orderNumber = "PAS-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) +
                "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setBuyer(buyer);
        order.setShippingAddress(address);
        order.setPaymentMethod(request.paymentMethod());
        order.setPaymentStatus("PAID");
        order.setOverallStatus(OrderStatus.PLACED);
        order.setShippingAmount(BigDecimal.ZERO);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();
        Set<Long> involvedSellerIds = new HashSet<>();

        for (OrderDtos.CheckoutItemRequest itemReq : request.items()) {
            Long productId = itemReq.productId();
            int requestedQty = itemReq.quantity();

            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + productId + " not found"));

            if (product.getModerationStatus() != ProductModerationStatus.APPROVED) {
                throw new BadRequestException("Product '" + product.getName() + "' is not currently available for purchase.");
            }

            // ATOMIC CONDITIONAL UPDATE:
            // UPDATE products SET stock = stock - :qty WHERE id = :id AND stock >= :qty
            int rowsAffected = productRepository.decrementStockIfSufficient(productId, requestedQty);
            if (rowsAffected == 0) {
                // Insufficient stock! Throw 409 Conflict with details
                throw new InsufficientStockException(productId, product.getName(), product.getStock(), requestedQty);
            }

            // Snapshot unit_price at purchase time
            BigDecimal unitPrice = product.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(requestedQty));
            totalAmount = totalAmount.add(subtotal);

            String primaryImage = product.getImages() != null && !product.getImages().isEmpty()
                    ? product.getImages().get(0).getImageUrl()
                    : null;

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setSeller(product.getSeller());
            orderItem.setProductName(product.getName());
            orderItem.setProductImage(primaryImage);
            orderItem.setUnitPrice(unitPrice);
            orderItem.setQuantity(requestedQty);
            orderItem.setSubtotal(subtotal);
            orderItem.setItemStatus(OrderStatus.PLACED);

            orderItems.add(orderItem);
            involvedSellerIds.add(product.getSeller().getId());
        }

        order.setTotalAmount(totalAmount);
        order.setItems(orderItems);

        Order savedOrder = orderRepository.save(order);

        // 3. Record Initial Status History
        OrderStatusHistory history = new OrderStatusHistory(
                savedOrder,
                null,
                OrderStatus.PLACED.name(),
                "Order placed successfully by buyer with " + orderItems.size() + " items.",
                buyer
        );
        orderStatusHistoryRepository.save(history);
        savedOrder.getStatusHistories().add(history);

        // 4. Log Activity
        activityLogService.log(
                buyer.getId(),
                buyer.getEmail(),
                "ORDER_PLACED",
                "ORDER",
                savedOrder.getId(),
                String.format("Order %s placed for total amount ₹%.2f across %d sellers",
                        orderNumber, totalAmount, involvedSellerIds.size()),
                ipAddress
        );

        OrderDtos.OrderResponseDto responseDto = toResponseDto(savedOrder);

        // 5. Realtime SSE Notifications
        // A. Broadcast to Admin Live Stream
        sseNotificationService.broadcastToAdmin("ORDER_PLACED", responseDto);

        // B. Notify each affected Seller about their newly placed items
        for (Long sellerId : involvedSellerIds) {
            List<OrderDtos.OrderItemDto> sellerItems = responseDto.items().stream()
                    .filter(i -> i.sellerId().equals(sellerId))
                    .toList();

            Map<String, Object> sellerAlert = Map.of(
                    "type", "NEW_ORDER",
                    "orderNumber", orderNumber,
                    "orderId", savedOrder.getId(),
                    "totalItems", sellerItems.size(),
                    "items", sellerItems,
                    "createdAt", savedOrder.getCreatedAt()
            );
            sseNotificationService.notifySeller(sellerId, "NEW_ORDER_ALERT", sellerAlert);
        }

        return responseDto;
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderDtos.OrderResponseDto> getBuyerOrders(User buyer, int page, int size) {
        Page<Order> p = orderRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId(), PageRequest.of(page, size));
        return PageResponse.from(p.map(this::toResponseDto));
    }

    @Transactional(readOnly = true)
    public OrderDtos.OrderResponseDto getOrderDetails(Long orderId, User requester) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // If buyer, verify ownership
        if (requester.getRole() == UserRole.BUYER && !order.getBuyer().getId().equals(requester.getId())) {
            throw new ForbiddenException("Unauthorized to view this order.");
        }

        return toResponseDto(order);
    }

    /**
     * Derives the overall order status from individual item statuses.
     */
    public static OrderStatus deriveOverallStatus(List<OrderItem> items) {
        if (items == null || items.isEmpty()) {
            return OrderStatus.PLACED;
        }

        Set<OrderStatus> statuses = items.stream().map(OrderItem::getItemStatus).collect(Collectors.toSet());

        if (statuses.size() == 1 && statuses.contains(OrderStatus.DELIVERED)) {
            return OrderStatus.DELIVERED;
        }
        if (statuses.size() == 1 && statuses.contains(OrderStatus.CANCELLED)) {
            return OrderStatus.CANCELLED;
        }
        if (statuses.contains(OrderStatus.OUT_FOR_DELIVERY)) {
            return OrderStatus.OUT_FOR_DELIVERY;
        }
        if (statuses.contains(OrderStatus.SHIPPED)) {
            return OrderStatus.SHIPPED;
        }
        if (statuses.contains(OrderStatus.PACKED)) {
            return OrderStatus.PACKED;
        }
        if (statuses.contains(OrderStatus.CONFIRMED)) {
            return OrderStatus.CONFIRMED;
        }
        return OrderStatus.PLACED;
    }

    public OrderDtos.OrderResponseDto toResponseDto(Order order) {
        BuyerDtos.AddressDto addrDto = null;
        if (order.getShippingAddress() != null) {
            Address a = order.getShippingAddress();
            addrDto = new BuyerDtos.AddressDto(
                    a.getId(),
                    a.getFullName(),
                    a.getPhone(),
                    a.getAddressLine1(),
                    a.getAddressLine2(),
                    a.getCity(),
                    a.getState(),
                    a.getPostalCode(),
                    a.getCountry(),
                    a.getIsDefault()
            );
        }

        List<OrderDtos.OrderItemDto> itemDtos = order.getItems().stream().map(item -> new OrderDtos.OrderItemDto(
                item.getId(),
                order.getId(),
                order.getOrderNumber(),
                item.getProduct().getId(),
                item.getSeller().getId(),
                item.getSeller().getFullName(),
                item.getProductName(),
                item.getProductImage(),
                item.getUnitPrice(),
                item.getQuantity(),
                item.getSubtotal(),
                item.getItemStatus(),
                item.getCreatedAt()
        )).toList();

        List<OrderDtos.OrderStatusHistoryDto> historyDtos = order.getStatusHistories().stream().map(h -> new OrderDtos.OrderStatusHistoryDto(
                h.getId(),
                order.getId(),
                h.getOrderItem() != null ? h.getOrderItem().getId() : null,
                h.getStatus(),
                h.getNotes(),
                h.getChangedByUser() != null ? h.getChangedByUser().getFullName() : "System",
                h.getCreatedAt()
        )).toList();

        return new OrderDtos.OrderResponseDto(
                order.getId(),
                order.getOrderNumber(),
                order.getBuyer().getId(),
                order.getBuyer().getFullName(),
                order.getBuyer().getEmail(),
                order.getTotalAmount(),
                order.getShippingAmount(),
                order.getPaymentMethod(),
                order.getPaymentStatus(),
                order.getOverallStatus(),
                addrDto,
                itemDtos,
                historyDtos,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
