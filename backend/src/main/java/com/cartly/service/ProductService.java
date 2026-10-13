package com.cartly.service;

import com.cartly.dto.PageResponse;
import com.cartly.dto.ProductDtos;
import com.cartly.entity.Product;
import com.cartly.entity.ProductImage;
import com.cartly.entity.ProductModerationStatus;
import com.cartly.entity.RecentlyViewed;
import com.cartly.entity.User;
import com.cartly.exception.ResourceNotFoundException;
import com.cartly.repository.ProductRepository;
import com.cartly.repository.RecentlyViewedRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final RecentlyViewedRepository recentlyViewedRepository;

    public ProductService(ProductRepository productRepository, RecentlyViewedRepository recentlyViewedRepository) {
        this.productRepository = productRepository;
        this.recentlyViewedRepository = recentlyViewedRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductDtos.ProductSummaryDto> searchProducts(
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean inStock,
            String query,
            String sortBy,
            int page,
            int size
    ) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        if ("price_asc".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "price");
        } else if ("price_desc".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "price");
        } else if ("name_asc".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "name");
        }

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Product> products = productRepository.searchApprovedProducts(
                category, minPrice, maxPrice, inStock, query, pageable
        );

        return PageResponse.from(products.map(this::toSummaryDto));
    }

    @Transactional
    public ProductDtos.ProductDto getProductBySlugOrId(String identifier, User viewer) {
        Product product;
        try {
            Long id = Long.parseLong(identifier);
            product = productRepository.findById(id)
                    .orElseGet(() -> productRepository.findBySlug(identifier)
                            .orElseThrow(() -> new ResourceNotFoundException("Product not found")));
        } catch (NumberFormatException e) {
            product = productRepository.findBySlug(identifier)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        }

        // Record recently viewed if viewer is authenticated
        if (viewer != null) {
            recordRecentlyViewed(viewer, product);
        }

        return toDto(product);
    }

    @Transactional(readOnly = true)
    public List<String> getCategories() {
        return productRepository.findDistinctCategories();
    }

    private void recordRecentlyViewed(User viewer, Product product) {
        recentlyViewedRepository.findByUserIdAndProductId(viewer.getId(), product.getId())
                .ifPresentOrElse(
                        rv -> {
                            rv.setViewedAt(LocalDateTime.now());
                            recentlyViewedRepository.save(rv);
                        },
                        () -> recentlyViewedRepository.save(new RecentlyViewed(viewer, product))
                );
    }

    public ProductDtos.ProductSummaryDto toSummaryDto(Product product) {
        List<ProductImage> imgs = product.getImages();
        String primary = null;
        String secondary = null;

        if (imgs != null && !imgs.isEmpty()) {
            primary = imgs.stream()
                    .filter(ProductImage::getIsPrimary)
                    .findFirst()
                    .map(ProductImage::getImageUrl)
                    .orElse(imgs.get(0).getImageUrl());

            if (imgs.size() > 1) {
                secondary = imgs.get(1).getImageUrl();
            } else {
                secondary = primary;
            }
        }

        return new ProductDtos.ProductSummaryDto(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getPrice(),
                product.getOriginalPrice(),
                product.getCategory(),
                product.getStock(),
                primary,
                secondary,
                product.getModerationStatus()
        );
    }

    public ProductDtos.ProductDto toDto(Product product) {
        List<ProductImage> imgs = product.getImages();
        List<String> imgUrls = imgs != null ? imgs.stream().map(ProductImage::getImageUrl).toList() : List.of();
        String primary = null;
        String secondary = null;

        if (imgs != null && !imgs.isEmpty()) {
            primary = imgs.stream()
                    .filter(ProductImage::getIsPrimary)
                    .findFirst()
                    .map(ProductImage::getImageUrl)
                    .orElse(imgs.get(0).getImageUrl());

            if (imgs.size() > 1) {
                secondary = imgs.get(1).getImageUrl();
            } else {
                secondary = primary;
            }
        }

        return new ProductDtos.ProductDto(
                product.getId(),
                product.getSeller().getId(),
                product.getSeller().getFullName(),
                product.getName(),
                product.getSlug(),
                product.getDescription(),
                product.getPrice(),
                product.getOriginalPrice(),
                product.getCategory(),
                product.getSku(),
                product.getStock(),
                product.getModerationStatus(),
                product.getModerationReason(),
                product.getSpecifications(),
                imgUrls,
                primary,
                secondary,
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
