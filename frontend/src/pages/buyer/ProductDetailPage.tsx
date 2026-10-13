import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Store,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  Check,
  ChevronRight,
  AlertCircle,
  Plus,
  Minus,
} from 'lucide-react';
import { api } from '../../api/client';
import { Product } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, setDrawerOpen } = useCartStore();
  const { user } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    api.public
      .getProduct(slug)
      .then((data) => {
        setProduct(data);
        const initialImg =
          data.primaryImage ||
          (data.images && data.images[0]) ||
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
        setSelectedImg(initialImg);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Product not found');
        navigate('/catalog');
      })
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading || !product) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const discountPercent =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const handleAddToCart = () => {
    if (product.stock <= 0) {
      toast.error('Product is out of stock.');
      return;
    }

    addItem(
      {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        originalPrice: product.originalPrice,
        image: selectedImg,
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        stock: product.stock,
      },
      quantity
    );

    setAdded(true);
    toast.success(`Added ${quantity}x "${product.name}" to cart`);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setDrawerOpen(false);
    navigate('/checkout');
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      toast.error('Please sign in to save items to wishlist');
      return;
    }
    const next = !isWishlisted;
    setIsWishlisted(next);
    try {
      if (next) {
        await api.buyer.addToWishlist(product.id);
        toast.success('Added to wishlist');
      } else {
        await api.buyer.removeFromWishlist(product.id);
        toast.info('Removed from wishlist');
      }
    } catch {
      setIsWishlisted(!next);
    }
  };

  // Parse specifications if present
  let specsObj: Record<string, string> = {};
  if (product.specifications) {
    try {
      specsObj = JSON.parse(product.specifications);
    } catch {
      // not JSON
    }
  }

  return (
    <div className="space-y-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/catalog" className="hover:text-foreground">
          Catalog
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/catalog?category=${encodeURIComponent(product.category)}`} className="hover:text-foreground capitalize">
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Gallery Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/4] rounded-4xl bg-surface-100 overflow-hidden border border-border/80 shadow-md">
            <img
              src={selectedImg}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-accent text-accent-foreground font-extrabold text-xs uppercase tracking-wider rounded-full shadow-lg">
                -{discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails Row */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(imgUrl)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImg === imgUrl
                      ? 'border-primary shadow-md scale-105'
                      : 'border-border/60 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Details Column */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider text-primary">{product.category}</span>
              <span className="font-mono">SKU: {product.sku}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-foreground leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 pt-1 text-xs text-amber-500 font-semibold">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-500" />
                ))}
              </div>
              <span className="text-muted-foreground">4.9 (48 verified studio collector reviews)</span>
            </div>
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-3xl bg-surface-100 dark:bg-surface-200/50 border border-border/80 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold font-display text-foreground">
              ₹{product.price.toFixed(2)}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-base text-muted-foreground line-through">
                ₹{product.originalPrice.toFixed(2)}
              </span>
            )}
            <span className="ml-auto text-xs text-emerald-500 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Best Price Direct from Maker
            </span>
          </div>

          {/* Stock Availability status */}
          <div>
            {product.stock > 5 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                In Stock ({product.stock} units available)
              </span>
            ) : product.stock > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-500 text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                Low Stock — Only {product.stock} units remain
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold">
                Sold Out (Awaiting new batch)
              </span>
            )}
          </div>

          {/* Quantity and Actions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border rounded-2xl bg-card p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-muted-foreground hover:text-foreground"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-bold text-foreground font-mono">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleWishlistToggle}
                className="p-3.5 rounded-2xl border border-border bg-card hover:bg-surface-100 text-foreground transition-colors"
                title="Wishlist"
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-foreground'
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="w-full py-4 bg-surface-200 dark:bg-surface-100 text-foreground font-bold text-sm rounded-2xl hover:bg-surface-300 dark:hover:bg-surface-200 transition-all flex items-center justify-center gap-2 border border-border disabled:opacity-40"
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>In Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-sm rounded-2xl shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
              >
                Buy Now
              </button>
            </div>
          </div>

          {/* Seller Atelier Card */}
          <div className="p-4 rounded-3xl bg-card border border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-foreground">{product.sellerName}</h4>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent/20 text-accent-foreground font-extrabold uppercase">
                    Verified
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">Independent Merchant & Creator</p>
              </div>
            </div>

            <Link
              to={`/catalog?seller=${product.sellerId}`}
              className="text-xs font-bold text-primary hover:underline"
            >
              Visit Store
            </Link>
          </div>

          {/* Value props micro-cards */}
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              <span>Direct Studio Dispatch</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-primary" />
              <span>7-Day Return Policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Technical Specs Section */}
      <div className="pt-12 border-t border-border/80 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7 space-y-4">
          <h3 className="text-xl font-bold font-display text-foreground">Design Narrative & Context</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {product.description || 'Crafted with premium materials and engineered for longevity. Every piece undergoes rigorous quality assessment before direct studio shipping.'}
          </p>
        </div>

        <div className="md:col-span-5 space-y-4">
          <h3 className="text-xl font-bold font-display text-foreground">Technical Specifications</h3>
          {Object.keys(specsObj).length > 0 ? (
            <div className="rounded-3xl border border-border overflow-hidden divide-y divide-border text-xs">
              {Object.entries(specsObj).map(([k, v]) => (
                <div key={k} className="p-3.5 flex justify-between bg-card">
                  <span className="font-semibold text-muted-foreground capitalize">{k}</span>
                  <span className="font-bold text-foreground">{String(v)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-3xl bg-surface-100 dark:bg-surface-200/40 border border-border text-xs text-muted-foreground">
              Official dimensions and specifications provided with studio certificate upon shipment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
