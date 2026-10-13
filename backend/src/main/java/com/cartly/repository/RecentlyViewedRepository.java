package com.cartly.repository;

import com.cartly.entity.RecentlyViewed;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecentlyViewedRepository extends JpaRepository<RecentlyViewed, Long> {

    @Query("SELECT r FROM RecentlyViewed r WHERE r.user.id = :userId ORDER BY r.viewedAt DESC")
    List<RecentlyViewed> findRecentByUser(@Param("userId") Long userId, Pageable pageable);

    Optional<RecentlyViewed> findByUserIdAndProductId(Long userId, Long productId);
}
