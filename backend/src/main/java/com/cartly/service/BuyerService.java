package com.cartly.service;

import com.cartly.dto.BuyerDtos;
import com.cartly.entity.*;
import com.cartly.exception.ForbiddenException;
import com.cartly.exception.ResourceNotFoundException;
import com.cartly.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class BuyerService {

    private final AddressRepository addressRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final WishlistRepository wishlistRepository;
    private final RecentlyViewedRepository recentlyViewedRepository;
    private final ProductRepository productRepository;

    public BuyerService(
            AddressRepository addressRepository,
            PaymentMethodRepository paymentMethodRepository,
            WishlistRepository wishlistRepository,
            RecentlyViewedRepository recentlyViewedRepository,
            ProductRepository productRepository
    ) {
        this.addressRepository = addressRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.wishlistRepository = wishlistRepository;
        this.recentlyViewedRepository = recentlyViewedRepository;
        this.productRepository = productRepository;
    }

    // Addresses
    @Transactional(readOnly = true)
    public List<BuyerDtos.AddressDto> getAddresses(User buyer) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(buyer.getId()).stream()
                .map(this::toAddressDto)
                .toList();
    }

    @Transactional
    public BuyerDtos.AddressDto createAddress(User buyer, BuyerDtos.AddressCreateRequest request) {
        if (Boolean.TRUE.equals(request.isDefault())) {
            addressRepository.findByUserIdAndIsDefaultTrue(buyer.getId()).ifPresent(a -> {
                a.setIsDefault(false);
                addressRepository.save(a);
            });
        }

        Address address = new Address();
        address.setUser(buyer);
        address.setFullName(request.fullName());
        address.setPhone(request.phone());
        address.setAddressLine1(request.addressLine1());
        address.setAddressLine2(request.addressLine2());
        address.setCity(request.city());
        address.setState(request.state());
        address.setPostalCode(request.postalCode());
        address.setCountry(request.country() != null ? request.country() : "India");
        address.setIsDefault(request.isDefault() != null ? request.isDefault() : false);

        return toAddressDto(addressRepository.save(address));
    }

    @Transactional
    public void deleteAddress(User buyer, Long addressId) {
        Address addr = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        if (!addr.getUser().getId().equals(buyer.getId())) {
            throw new ForbiddenException("Unauthorized");
        }
        addressRepository.delete(addr);
    }

    // Payment Methods
    @Transactional(readOnly = true)
    public List<BuyerDtos.PaymentMethodDto> getPaymentMethods(User buyer) {
        return paymentMethodRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(buyer.getId()).stream()
                .map(p -> new BuyerDtos.PaymentMethodDto(
                        p.getId(),
                        p.getProvider(),
                        p.getCardType(),
                        p.getMaskedNumber(),
                        p.getExpiryMonth(),
                        p.getExpiryYear(),
                        p.getIsDefault()
                )).toList();
    }

    @Transactional
    public BuyerDtos.PaymentMethodDto createPaymentMethod(User buyer, BuyerDtos.PaymentMethodCreateRequest request) {
        PaymentMethod pm = new PaymentMethod();
        pm.setUser(buyer);
        pm.setProvider(request.provider());
        pm.setCardType(request.cardType());
        pm.setMaskedNumber(request.maskedNumber());
        pm.setExpiryMonth(request.expiryMonth());
        pm.setExpiryYear(request.expiryYear());
        pm.setIsDefault(request.isDefault() != null ? request.isDefault() : false);

        PaymentMethod saved = paymentMethodRepository.save(pm);
        return new BuyerDtos.PaymentMethodDto(
                saved.getId(),
                saved.getProvider(),
                saved.getCardType(),
                saved.getMaskedNumber(),
                saved.getExpiryMonth(),
                saved.getExpiryYear(),
                saved.getIsDefault()
        );
    }

    // Wishlist with Price Drop Badge
    @Transactional(readOnly = true)
    public List<BuyerDtos.WishlistResponseDto> getWishlist(User buyer) {
        List<WishlistItem> items = wishlistRepository.findByUserIdOrderByCreatedAtDesc(buyer.getId());
        return items.stream().map(item -> {
            Product p = item.getProduct();
            BigDecimal currentPrice = p.getPrice();
            BigDecimal priceAtAdd = item.getPriceAtAdd();

            boolean hasPriceDropped = currentPrice.compareTo(priceAtAdd) < 0;
            BigDecimal dropAmount = hasPriceDropped ? priceAtAdd.subtract(currentPrice) : BigDecimal.ZERO;

            String primaryImg = (p.getImages() != null && !p.getImages().isEmpty())
                    ? p.getImages().get(0).getImageUrl() : null;

            return new BuyerDtos.WishlistResponseDto(
                    item.getId(),
                    p.getId(),
                    p.getName(),
                    p.getSlug(),
                    primaryImg,
                    currentPrice,
                    priceAtAdd,
                    hasPriceDropped,
                    dropAmount,
                    p.getStock(),
                    p.getCategory()
            );
        }).toList();
    }

    @Transactional
    public void addToWishlist(User buyer, Long productId) {
        if (!wishlistRepository.existsByUserIdAndProductId(buyer.getId(), productId)) {
            Product p = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            wishlistRepository.save(new WishlistItem(buyer, p, p.getPrice()));
        }
    }

    @Transactional
    public void removeFromWishlist(User buyer, Long productId) {
        wishlistRepository.deleteByUserIdAndProductId(buyer.getId(), productId);
    }

    // Recently Viewed
    @Transactional(readOnly = true)
    public List<BuyerDtos.RecentlyViewedDto> getRecentlyViewed(User buyer, int limit) {
        int max = limit > 0 ? limit : 10;
        List<RecentlyViewed> recents = recentlyViewedRepository.findRecentByUser(buyer.getId(), PageRequest.of(0, max));
        return recents.stream().map(r -> {
            Product p = r.getProduct();
            String img = (p.getImages() != null && !p.getImages().isEmpty()) ? p.getImages().get(0).getImageUrl() : null;
            return new BuyerDtos.RecentlyViewedDto(
                    r.getId(),
                    p.getId(),
                    p.getName(),
                    p.getSlug(),
                    img,
                    p.getPrice(),
                    p.getCategory(),
                    r.getViewedAt()
            );
        }).toList();
    }

    private BuyerDtos.AddressDto toAddressDto(Address a) {
        return new BuyerDtos.AddressDto(
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
}
