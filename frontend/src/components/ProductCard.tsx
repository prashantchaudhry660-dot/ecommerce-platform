import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Check, Star, AlertCircle } from 'lucide-react';
import { ProductSummary } from '../types';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/client';
import { toast } from 'sonner';

interface ProductCardProps {
  product: ProductSummary;
  isWishlisted?: boolean;
  onWishlistToggle?: (productId: number, active: boolean) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, isWishlisted = false, onWishlistToggle }) => {
  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const [wish, setWish] = useState(isWishlisted);
  const [added, setAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const discountPercent =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please sign in to save items to your wishlist');
      return;
    }

    const next = !wish;
    setWish(next);
    try {
      if (next) {
        await api.buyer.addToWishlist(product.id);
        toast.success(`Saved "${product.name}" to wishlist`);
      } else {
        await api.buyer.removeFromWishlist(product.id);
        toast.info(`Removed from wishlist`);
      }
      onWishlistToggle?.(product.id, next);
    } catch {
      setWish(!next);
      toast.error('Could not update wishlist');
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.primaryImage,
      stock: product.stock,
    });

    setAdded(true);
    toast.success(`Added ${product.name} to cart`);
    setTimeout(() => setAdded(false), 1500);
  };

  const currentImg =
    isHovered && product.secondaryImage
      ? product.secondaryImage
      : product.primaryImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80';

  return (
    <div
      className="group relative flex flex-col bg-card rounded-3xl border border-border/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <Link to={`/products/${product.slug}`} className="relative aspect-[4/5] overflow-hidden bg-surface-100">
        <img
          src={currentImg}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {discountPercent > 0 && (
            <span className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-accent text-accent-foreground rounded-full shadow-md">
              -{discountPercent}%
            </span>
          )}
          {product.stock > 0 && product.stock <= 5 && (
            <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/90 text-white backdrop-blur-md rounded-full shadow-md flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Only {product.stock} left
            </span>
          )}
          {product.stock === 0 && (
            <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/90 text-white backdrop-blur-md rounded-full shadow-md">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist Spring Heart Button */}
        <button
          onClick={handleWishlist}
          aria-label="Save to wishlist"
          className="absolute top-3 right-3 p-2.5 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md border border-white/20 dark:border-white/10 text-foreground shadow-md hover:scale-110 active:scale-95 transition-all z-10"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              wish ? 'fill-rose-500 text-rose-500' : 'text-foreground'
            }`}
          />
        </button>

        {/* Quick Add Button on Hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="w-full py-2.5 bg-foreground text-background text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-xl hover:bg-primary hover:text-white transition-all active:scale-95 disabled:opacity-40"
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" /> Added
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> Quick Add
              </>
            )}
          </button>
        </div>
      </Link>

      {/* Info Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span className="capitalize font-medium">{product.category}</span>
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-500" />
            <span>4.9</span>
          </div>
        </div>

        <Link to={`/products/${product.slug}`} className="group-hover:text-primary transition-colors">
          <h3 className="text-sm font-bold text-foreground line-clamp-1 font-display tracking-tight">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-3 flex items-baseline gap-2">
          <span className="text-base font-extrabold text-foreground font-display">
            ₹{product.price.toFixed(2)}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-muted-foreground line-through font-normal">
              ₹{product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
