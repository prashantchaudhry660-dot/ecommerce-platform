package com.cartly.exception;

public class InsufficientStockException extends RuntimeException {
    private final Long productId;
    private final String productName;
    private final Integer availableStock;
    private final Integer requestedQuantity;

    public InsufficientStockException(Long productId, String productName, Integer availableStock, Integer requestedQuantity) {
        super(String.format("Insufficient stock for product '%s' (ID: %d). Available: %d, Requested: %d",
                productName, productId, availableStock != null ? availableStock : 0, requestedQuantity));
        this.productId = productId;
        this.productName = productName;
        this.availableStock = availableStock;
        this.requestedQuantity = requestedQuantity;
    }

    public Long getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public Integer getAvailableStock() {
        return availableStock;
    }

    public Integer getRequestedQuantity() {
        return requestedQuantity;
    }
}
