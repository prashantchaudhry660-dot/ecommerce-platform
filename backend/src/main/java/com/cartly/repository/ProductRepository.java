package com.cartly.repository;

import com.cartly.entity.Product;
import com.cartly.entity.ProductModerationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySku(String sku);

    Page<Product> findBySellerId(Long sellerId, Pageable pageable);

    long countBySellerId(Long sellerId);

    @Query("SELECT p FROM Product p WHERE p.seller.id = :sellerId AND p.stock <= :threshold")
    List<Product> findLowStockProducts(@Param("sellerId") Long sellerId, @Param("threshold") Integer threshold);

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.moderationStatus = 'APPROVED'")
    List<String> findDistinctCategories();

    @Query("SELECT p FROM Product p WHERE " +
           "p.moderationStatus = 'APPROVED' AND " +
           "(:category IS NULL OR :category = '' OR p.category = :category) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "(:inStock IS NULL OR :inStock = false OR p.stock > 0) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.category) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> searchApprovedProducts(
            @Param("category") String category,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("inStock") Boolean inStock,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT p FROM Product p WHERE " +
           "(:status IS NULL OR p.moderationStatus = :status) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.category) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> searchAllForAdmin(
            @Param("status") ProductModerationStatus status,
            @Param("search") String search,
            Pageable pageable
    );

    @Modifying
    @Query("UPDATE Product p SET p.stock = p.stock - :quantity WHERE p.id = :productId AND p.stock >= :quantity")
    int decrementStockIfSufficient(@Param("productId") Long productId, @Param("quantity") Integer quantity);

    @Modifying
    @Query("UPDATE Product p SET p.stock = p.stock + :quantity WHERE p.id = :productId")
    int incrementStock(@Param("productId") Long productId, @Param("quantity") Integer quantity);
}
