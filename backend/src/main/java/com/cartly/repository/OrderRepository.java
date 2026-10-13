package com.cartly.repository;

import com.cartly.entity.Order;
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
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    Page<Order> findByBuyerIdOrderByCreatedAtDesc(Long buyerId, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE " +
           "(:status IS NULL OR o.overallStatus = :status) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(o.buyer.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(o.buyer.fullName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Order> searchOrdersAdmin(
            @Param("status") OrderStatus status,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.overallStatus <> 'CANCELLED'")
    BigDecimal calculatePlatformGmv();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :since")
    long countOrdersSince(@Param("since") LocalDateTime since);

    @Query("SELECT FUNCTION('DATE', o.createdAt) as day, COALESCE(SUM(o.totalAmount), 0) as gmv, COUNT(o) as orderCount " +
           "FROM Order o WHERE o.createdAt >= :startDate AND o.overallStatus <> 'CANCELLED' " +
           "GROUP BY FUNCTION('DATE', o.createdAt) ORDER BY day ASC")
    List<Object[]> getDailyPlatformMetrics(@Param("startDate") LocalDateTime startDate);
}
