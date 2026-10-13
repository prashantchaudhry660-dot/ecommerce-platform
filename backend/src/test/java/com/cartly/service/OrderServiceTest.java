package com.cartly.service;

import com.cartly.dto.OrderDtos;
import com.cartly.entity.*;
import com.cartly.exception.InsufficientStockException;
import com.cartly.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private ActivityLogService activityLogService;

    @Mock
    private SseNotificationService sseNotificationService;

    @InjectMocks
    private OrderService orderService;

    private User buyer;
    private User seller1;
    private User seller2;
    private Product product1;
    private Product product2;
    private Address address;

    @BeforeEach
    void setUp() {
        buyer = new User("buyer@example.com", "hash", "Jane Buyer", UserRole.BUYER, UserStatus.ACTIVE);
        buyer.setId(10L);

        seller1 = new User("seller1@example.com", "hash", "Studio Aura", UserRole.SELLER, UserStatus.ACTIVE);
        seller1.setId(21L);

        seller2 = new User("seller2@example.com", "hash", "Kanso Studio", UserRole.SELLER, UserStatus.ACTIVE);
        seller2.setId(22L);

        product1 = new Product();
        product1.setId(101L);
        product1.setName("Minimalist Ceramic Lamp");
        product1.setPrice(new BigDecimal("1299.00"));
        product1.setOriginalPrice(new BigDecimal("1599.00"));
        product1.setStock(10);
        product1.setSeller(seller1);
        product1.setModerationStatus(ProductModerationStatus.APPROVED);

        product2 = new Product();
        product2.setId(102L);
        product2.setName("Oak Ergonomic Desk Riser");
        product2.setPrice(new BigDecimal("2499.00"));
        product2.setOriginalPrice(new BigDecimal("2999.00"));
        product2.setStock(5);
        product2.setSeller(seller2);
        product2.setModerationStatus(ProductModerationStatus.APPROVED);

        address = new Address();
        address.setId(1L);
        address.setUser(buyer);
        address.setFullName("Jane Buyer");
        address.setPhone("9876543210");
        address.setAddressLine1("42 Design Blvd");
        address.setCity("Bengaluru");
        address.setState("Karnataka");
        address.setPostalCode("560001");
        address.setIsDefault(true);
    }

    @Test
    @DisplayName("Should successfully checkout multi-vendor order and split items across sellers")
    void shouldSuccessfullyCheckoutMultiVendorOrder() {
        // Arrange
        when(addressRepository.findById(1L)).thenReturn(Optional.of(address));
        when(productRepository.findById(101L)).thenReturn(Optional.of(product1));
        when(productRepository.findById(102L)).thenReturn(Optional.of(product2));

        // Atomic conditional decrement succeeds for both products
        when(productRepository.decrementStockIfSufficient(101L, 2)).thenReturn(1);
        when(productRepository.decrementStockIfSufficient(102L, 1)).thenReturn(1);

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(999L);
            return o;
        });

        List<OrderDtos.CheckoutItemRequest> items = List.of(
                new OrderDtos.CheckoutItemRequest(101L, 2),
                new OrderDtos.CheckoutItemRequest(102L, 1)
        );
        OrderDtos.CheckoutRequest request = new OrderDtos.CheckoutRequest(items, 1L, null, "CARD");

        // Act
        OrderDtos.OrderResponseDto response = orderService.checkout(buyer, request, "127.0.0.1");

        // Assert
        assertNotNull(response);
        assertEquals(999L, response.id());
        assertEquals(2, response.items().size());

        // Verify total amount = (1299 * 2) + (2499 * 1) = 2598 + 2499 = 5097
        assertEquals(new BigDecimal("5097.00"), response.totalAmount());

        // Verify multi-vendor seller association
        assertEquals(seller1.getId(), response.items().get(0).sellerId());
        assertEquals(seller2.getId(), response.items().get(1).sellerId());

        // Verify initial status
        assertEquals(OrderStatus.PLACED, response.overallStatus());
        assertEquals(OrderStatus.PLACED, response.items().get(0).itemStatus());
        assertEquals(OrderStatus.PLACED, response.items().get(1).itemStatus());

        // Verify atomic decrement was called
        verify(productRepository, times(1)).decrementStockIfSufficient(101L, 2);
        verify(productRepository, times(1)).decrementStockIfSufficient(102L, 1);

        // Verify SSE notifications were fired to admin and both sellers
        verify(sseNotificationService, times(1)).broadcastToAdmin(eq("ORDER_PLACED"), any());
        verify(sseNotificationService, times(1)).notifySeller(eq(seller1.getId()), eq("NEW_ORDER_ALERT"), any());
        verify(sseNotificationService, times(1)).notifySeller(eq(seller2.getId()), eq("NEW_ORDER_ALERT"), any());
    }

    @Test
    @DisplayName("Should throw InsufficientStockException (409) and prevent checkout when stock is insufficient")
    void shouldThrowInsufficientStockExceptionWhenStockDepleted() {
        // Arrange
        when(addressRepository.findById(1L)).thenReturn(Optional.of(address));
        when(productRepository.findById(101L)).thenReturn(Optional.of(product1));

        // Atomic conditional decrement returns 0 (condition failed)
        when(productRepository.decrementStockIfSufficient(101L, 15)).thenReturn(0);

        List<OrderDtos.CheckoutItemRequest> items = List.of(
                new OrderDtos.CheckoutItemRequest(101L, 15)
        );
        OrderDtos.CheckoutRequest request = new OrderDtos.CheckoutRequest(items, 1L, null, "CARD");

        // Act & Assert
        InsufficientStockException exception = assertThrows(
                InsufficientStockException.class,
                () -> orderService.checkout(buyer, request, "127.0.0.1")
        );

        assertEquals(101L, exception.getProductId());
        assertEquals(15, exception.getRequestedQuantity());
        verify(orderRepository, never()).save(any());
        verify(sseNotificationService, never()).broadcastToAdmin(anyString(), any());
    }

    @Test
    @DisplayName("Should correctly derive overall order status from individual item statuses")
    void shouldDeriveOverallOrderStatusCorrectly() {
        OrderItem itemA = new OrderItem();
        OrderItem itemB = new OrderItem();

        // 1. Both PLACED -> PLACED
        itemA.setItemStatus(OrderStatus.PLACED);
        itemB.setItemStatus(OrderStatus.PLACED);
        assertEquals(OrderStatus.PLACED, OrderService.deriveOverallStatus(List.of(itemA, itemB)));

        // 2. One CONFIRMED, one PLACED -> CONFIRMED
        itemA.setItemStatus(OrderStatus.CONFIRMED);
        assertEquals(OrderStatus.CONFIRMED, OrderService.deriveOverallStatus(List.of(itemA, itemB)));

        // 3. One SHIPPED, one CONFIRMED -> SHIPPED
        itemA.setItemStatus(OrderStatus.SHIPPED);
        assertEquals(OrderStatus.SHIPPED, OrderService.deriveOverallStatus(List.of(itemA, itemB)));

        // 4. One DELIVERED, one SHIPPED -> SHIPPED
        itemA.setItemStatus(OrderStatus.DELIVERED);
        itemB.setItemStatus(OrderStatus.SHIPPED);
        assertEquals(OrderStatus.SHIPPED, OrderService.deriveOverallStatus(List.of(itemA, itemB)));

        // 5. Both DELIVERED -> DELIVERED
        itemB.setItemStatus(OrderStatus.DELIVERED);
        assertEquals(OrderStatus.DELIVERED, OrderService.deriveOverallStatus(List.of(itemA, itemB)));

        // 6. Both CANCELLED -> CANCELLED
        itemA.setItemStatus(OrderStatus.CANCELLED);
        itemB.setItemStatus(OrderStatus.CANCELLED);
        assertEquals(OrderStatus.CANCELLED, OrderService.deriveOverallStatus(List.of(itemA, itemB)));
    }
}
