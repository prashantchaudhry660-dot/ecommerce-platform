package com.cartly.repository;

import com.cartly.entity.OrderItem;
import com.cartly.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.seller.id = :sellerId ORDER BY oi.createdAt DESC")
    Page<OrderItem> findBySellerId(@Param("sellerId") Long sellerId, Pageable pageable);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.seller.id = :sellerId AND " +
           "(:status IS NULL OR oi.itemStatus = :status) ORDER BY oi.createdAt DESC")
    List<OrderItem> findBySellerIdAndStatus(@Param("sellerId") Long sellerId, @Param("status") OrderStatus status);

    @Query("SELECT COALESCE(SUM(oi.subtotal), 0) FROM OrderItem oi WHERE oi.seller.id = :sellerId AND oi.itemStatus <> 'CANCELLED'")
    BigDecimal calculateSellerTotalRevenue(@Param("sellerId") Long sellerId);

    @Query("SELECT COUNT(DISTINCT oi.order.id) FROM OrderItem oi WHERE oi.seller.id = :sellerId")
    long countDistinctOrdersForSeller(@Param("sellerId") Long sellerId);

    @Query("SELECT oi.productName, SUM(oi.quantity), SUM(oi.subtotal), oi.productImage " +
           "FROM OrderItem oi WHERE oi.seller.id = :sellerId AND oi.itemStatus <> 'CANCELLED' " +
           "GROUP BY oi.product.id, oi.productName, oi.productImage ORDER BY SUM(oi.subtotal) DESC")
    List<Object[]> findTopSellingProductsBySeller(@Param("sellerId") Long sellerId, Pageable pageable);

    @Query("SELECT oi.itemStatus, COUNT(oi.id) FROM OrderItem oi WHERE oi.seller.id = :sellerId GROUP BY oi.itemStatus")
    List<Object[]> countOrdersByStatusForSeller(@Param("sellerId") Long sellerId);

    @Query("SELECT FUNCTION('DATE', oi.createdAt) as day, COALESCE(SUM(oi.subtotal), 0) as revenue, COUNT(oi.id) as itemCount " +
           "FROM OrderItem oi WHERE oi.seller.id = :sellerId AND oi.createdAt >= :startDate AND oi.itemStatus <> 'CANCELLED' " +
           "GROUP BY FUNCTION('DATE', oi.createdAt) ORDER BY day ASC")
    List<Object[]> getSellerDailySales(
            @Param("sellerId") Long sellerId,
            @Param("startDate") LocalDateTime startDate
    );
}
