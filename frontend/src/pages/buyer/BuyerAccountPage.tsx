import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Package,
  Heart,
  MapPin,
  CreditCard,
  Eye,
  Trash2,
  TrendingDown,
  ShoppingBag,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { api } from '../../api/client';
import { Order, WishlistItem, Address, PaymentMethod, RecentlyViewedItem } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { toast } from 'sonner';

export const BuyerAccountPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addItem } = useCartStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'addresses' | 'payments' | 'recent'>('orders');

  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [recent, setRecent] = useState<RecentlyViewedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Address Modal / State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newFullName, setNewFullName] = useState(user?.fullName || '');
  const [newPhone, setNewPhone] = useState('');
  const [newLine1, setNewLine1] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPostal, setNewPostal] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.buyer.getOrders({ size: 20 }).then((res) => setOrders(res.content)),
      api.buyer.getWishlist().then(setWishlist),
      api.buyer.getAddresses().then(setAddresses),
      api.buyer.getPaymentMethods().then(setPayments),
      api.buyer.getRecentlyViewed(10).then(setRecent),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRemoveWishlist = async (productId: number) => {
    try {
      await api.buyer.removeFromWishlist(productId);
      setWishlist((prev) => prev.filter((w) => w.productId !== productId));
      toast.info('Removed from wishlist');
    } catch {
      toast.error('Could not remove item');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newPhone || !newLine1 || !newCity || !newState || !newPostal) {
      toast.error('Please fill in all address fields');
      return;
    }
    try {
      const created = await api.buyer.createAddress({
        fullName: newFullName,
        phone: newPhone,
        addressLine1: newLine1,
        city: newCity,
        state: newState,
        postalCode: newPostal,
        country: 'India',
        isDefault: addresses.length === 0,
      });
      setAddresses([created, ...addresses]);
      setShowAddressForm(false);
      toast.success('Address added to your address book');
    } catch {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      await api.buyer.deleteAddress(id);
      setAddresses(addresses.filter((a) => a.id !== id));
      toast.success('Address removed');
    } catch {
      toast.error('Failed to remove address');
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Overview Card */}
      <div className="p-6 sm:p-8 rounded-4xl bg-gradient-to-r from-surface-100 to-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/20 text-primary flex items-center justify-center text-2xl font-black font-display shadow-md">
            {user?.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold font-display text-foreground">{user?.fullName}</h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary">
                Collector Account
              </span>
              <span className="text-[11px] text-muted-foreground">
                Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/catalog"
            className="px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary-hover transition-all"
          >
            Explore Catalog
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border/80 overflow-x-auto scrollbar-none pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all ${
            activeTab === 'orders'
              ? 'bg-foreground text-background shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all ${
            activeTab === 'wishlist'
              ? 'bg-foreground text-background shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-100'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500" />
          <span>Wishlist ({wishlist.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all ${
            activeTab === 'addresses'
              ? 'bg-foreground text-background shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Addresses ({addresses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all ${
            activeTab === 'payments'
              ? 'bg-foreground text-background shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Saved Payments ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('recent')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all ${
            activeTab === 'recent'
              ? 'bg-foreground text-background shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-100'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Recently Viewed ({recent.length})</span>
        </button>
      </div>

      {/* TAB 1: Orders History */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="p-12 rounded-3xl bg-card border border-border text-center text-muted-foreground space-y-3">
              <Package className="w-8 h-8 opacity-40 mx-auto" />
              <h3 className="font-bold text-foreground text-sm">No orders placed yet</h3>
              <p className="text-xs">Your completed purchases will appear here with live tracking milestones.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="p-5 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/60 gap-2 text-xs">
                    <div>
                      <span className="font-mono font-bold text-primary text-sm">{o.orderNumber}</span>
                      <p className="text-[11px] text-muted-foreground">
                        Placed on {new Date(o.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-primary/10 text-primary">
                        {o.overallStatus}
                      </span>
                      <Link
                        to={`/orders/${o.id}/track`}
                        className="px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-200 text-xs font-bold text-foreground hover:bg-surface-200 flex items-center gap-1"
                      >
                        <span>Track Timeline</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Order Line Items */}
                  <div className="space-y-3">
                    {o.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80'}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-foreground">{item.productName}</p>
                            <p className="text-[11px] text-muted-foreground">
                              Creator: <span className="font-medium text-foreground">{item.sellerName}</span> • Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-foreground">₹{item.subtotal.toFixed(2)}</span>
                          <span className="block text-[10px] text-muted-foreground uppercase font-bold">
                            {item.itemStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Payment: {o.paymentMethod}</span>
                    <span className="text-sm font-extrabold font-display text-foreground">
                      Total: ₹{o.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Wishlist with Price Drop Badge */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlist.length === 0 ? (
            <div className="p-12 rounded-3xl bg-card border border-border text-center text-muted-foreground space-y-3">
              <Heart className="w-8 h-8 opacity-40 mx-auto" />
              <h3 className="font-bold text-foreground text-sm">Your wishlist is empty</h3>
              <p className="text-xs">Save works you love to monitor potential price drops.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-3xl bg-card border border-border/80 flex flex-col justify-between shadow-sm space-y-4"
                >
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface-100">
                    <img
                      src={item.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {item.hasPriceDropped && (
                      <span className="absolute top-2 left-2 px-2.5 py-1 bg-emerald-500 text-white font-extrabold text-[11px] rounded-full flex items-center gap-1 shadow-md">
                        <TrendingDown className="w-3.5 h-3.5" /> Price Drop: ₹{item.priceDropAmount.toFixed(2)}
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveWishlist(item.productId)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-white/80 dark:bg-black/60 text-muted-foreground hover:text-rose-500 shadow-md transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-primary uppercase">{item.category}</span>
                    <Link to={`/products/${item.productSlug}`}>
                      <h4 className="text-sm font-bold text-foreground line-clamp-1 hover:underline">
                        {item.productName}
                      </h4>
                    </Link>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-base font-extrabold text-foreground font-display">
                        ₹{item.currentPrice.toFixed(2)}
                      </span>
                      {item.hasPriceDropped && (
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{item.priceAtAdd.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      addItem({
                        productId: item.productId,
                        name: item.productName,
                        slug: item.productSlug,
                        price: item.currentPrice,
                        originalPrice: item.priceAtAdd,
                        image: item.productImage,
                        stock: item.stock,
                      });
                      toast.success(`Added ${item.productName} to cart`);
                    }}
                    className="w-full py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary-hover transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Addresses */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-foreground">Address Book</h3>
            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Address
            </button>
          </div>

          {showAddressForm && (
            <form onSubmit={handleAddAddress} className="p-6 rounded-3xl bg-card border border-border space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add New Address</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-muted-foreground mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border"
                  />
                </div>
              </div>
              <div className="text-xs">
                <label className="block text-muted-foreground mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={newLine1}
                  onChange={(e) => setNewLine1(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border"
                />
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-muted-foreground mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={newPostal}
                    onChange={(e) => setNewPostal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border"
                  />
                </div>
              </div>
              <button type="submit" className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl">
                Save Address
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((a) => (
              <div key={a.id} className="p-4 rounded-3xl bg-card border border-border space-y-2 text-xs relative">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-sm">{a.fullName}</span>
                  {a.isDefault && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">{a.addressLine1}</p>
                <p className="text-muted-foreground">
                  {a.city}, {a.state} — {a.postalCode}
                </p>
                <p className="text-muted-foreground">Phone: {a.phone}</p>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleDeleteAddress(a.id)}
                    className="text-muted-foreground hover:text-rose-500 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Saved Payments */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {payments.map((p) => (
              <div key={p.id} className="p-5 rounded-3xl bg-card border border-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-sm uppercase">{p.provider} ({p.cardType})</span>
                  {p.isDefault && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary">
                      Primary
                    </span>
                  )}
                </div>
                <p className="font-mono text-base font-bold text-foreground pt-1">{p.maskedNumber}</p>
                <p className="text-muted-foreground">Expires: {p.expiryMonth}/{p.expiryYear}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Recently Viewed */}
      {activeTab === 'recent' && (
        <div>
          {recent.length === 0 ? (
            <div className="p-12 rounded-3xl bg-card border border-border text-center text-muted-foreground text-xs">
              No recently viewed products recorded yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {recent.map((r) => (
                <Link
                  key={r.id}
                  to={`/products/${r.productSlug}`}
                  className="p-3 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors space-y-2"
                >
                  <img src={r.productImage} alt="" className="w-full aspect-[4/3] rounded-xl object-cover bg-surface-100" />
                  <p className="text-xs font-bold text-foreground truncate">{r.productName}</p>
                  <p className="text-xs font-bold text-primary font-display">₹{r.price.toFixed(2)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
