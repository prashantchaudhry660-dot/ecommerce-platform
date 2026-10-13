package com.cartly.controller;

import com.cartly.dto.PageResponse;
import com.cartly.dto.ProductDtos;
import com.cartly.entity.User;
import com.cartly.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/public")
@Tag(name = "Public Catalog", description = "Endpoints for product search, categories and catalog exploration")
public class PublicCatalogController {

    private final ProductService productService;

    public PublicCatalogController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/products")
    @Operation(summary = "Search and filter approved catalog products with pagination")
    public ResponseEntity<PageResponse<ProductDtos.ProductSummaryDto>> searchProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) String query,
            @RequestParam(required = false, defaultValue = "newest") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ResponseEntity.ok(productService.searchProducts(category, minPrice, maxPrice, inStock, query, sortBy, page, size));
    }

    @GetMapping("/products/{identifier}")
    @Operation(summary = "Get product details by slug or numeric ID")
    public ResponseEntity<ProductDtos.ProductDto> getProductDetails(
            @PathVariable String identifier,
            @AuthenticationPrincipal User viewer
    ) {
        return ResponseEntity.ok(productService.getProductBySlugOrId(identifier, viewer));
    }

    @GetMapping("/categories")
    @Operation(summary = "Get all distinct active product categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(productService.getCategories());
    }
}
