import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { items, isDrawerOpen, setDrawerOpen, updateQuantity, removeItem, getSubtotal, clearCart } = useCartStore();

  if (!isDrawerOpen) return null;

  const subtotal = getSubtotal();
  const freeShippingThreshold = 2000;
  const progressPercent = Math.min((subtotal / freeShippingThreshold) * 100, 100);

  // Group items by seller for clear multi-vendor visibility
  const distinctSellers = Array.from(new Set(items.map((i) => i.sellerName || 'Independent Artisan')));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setDrawerOpen(false)}>
      <div
        className="w-full max-w-md h-full bg-card border-l border-border flex flex-col shadow-2xl glass-panel animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold font-display tracking-tight">Your Cart ({items.length})</h2>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-200 dark:hover:bg-surface-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Meter */}
        <div className="px-5 py-3 bg-surface-100 dark:bg-surface-200/50 border-b border-border/60 text-xs">
          {subtotal >= freeShippingThreshold ? (
            <p className="text-emerald-500 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> You've unlocked Complimentary Express Delivery!
            </p>
          ) : (
            <div>
              <p className="text-muted-foreground mb-1.5">
                Add <span className="font-semibold text-foreground">₹{(freeShippingThreshold - subtotal).toFixed(2)}</span> more for Free Express Delivery
              </p>
              <div className="w-full h-1.5 bg-surface-300 dark:bg-surface-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-surface-200 dark:bg-surface-100 flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Your cart is empty</h3>
              <p className="text-xs mb-6 max-w-xs">Explore curated designs from independent creators across the platform.</p>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  navigate('/catalog');
                }}
                className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary-hover transition-all"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {distinctSellers.map((seller) => {
                const sellerItems = items.filter((i) => (i.sellerName || 'Independent Artisan') === seller);
                return (
                  <div key={seller} className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1 border-b border-border/40">
                      <span>Store:</span>
                      <span className="text-foreground font-medium">{seller}</span>
                    </div>

                    {sellerItems.map((item) => (
                      <div
                        key={item.productId}
                        className="flex gap-3 p-3 rounded-2xl bg-surface-100/60 dark:bg-surface-100/40 border border-border/60 hover:border-primary/40 transition-colors"
                      >
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80'}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 bg-surface-200"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground truncate">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold text-foreground">₹{item.price.toFixed(2)}</span>
                            {item.originalPrice > item.price && (
                              <span className="text-xs text-muted-foreground line-through">
                                ₹{item.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            {/* Quantity Controls */}
                            <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="p-1 hover:bg-surface-200 text-muted-foreground hover:text-foreground"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2.5 text-xs font-bold text-foreground">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                                className="p-1 hover:bg-surface-200 text-muted-foreground hover:text-foreground disabled:opacity-30"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.productId)}
                              className="text-xs text-muted-foreground hover:text-rose-500 p-1 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-border bg-card/60 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-lg font-bold font-display text-foreground">₹{subtotal.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Taxes and multi-vendor delivery calculated at checkout.</p>
            <button
              onClick={() => {
                setDrawerOpen(false);
                navigate('/checkout');
              }}
              className="w-full py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all hover:scale-[1.01]"
            >
              <span>Proceed to Multi-Vendor Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
