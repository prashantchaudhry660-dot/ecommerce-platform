import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  MapPin,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertTriangle,
  Plus,
  Store,
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';
import { Address } from '../../types';
import { toast } from 'sonner';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | undefined>(undefined);
  const [showNewAddress, setShowNewAddress] = useState(false);

  // New Address Form State
  const [newFullName, setNewFullName] = useState(user?.fullName || '');
  const [newPhone, setNewPhone] = useState('9876543210');
  const [newLine1, setNewLine1] = useState('42 Contemporary Art Blvd, Suite 300');
  const [newCity, setNewCity] = useState('Bengaluru');
  const [newState, setNewState] = useState('Karnataka');
  const [newPostal, setNewPostal] = useState('560001');

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'UPI' | 'NET_BANKING'>('CREDIT_CARD');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [loading, setLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/catalog');
      return;
    }

    // Load addresses
    api.buyer
      .getAddresses()
      .then((data) => {
        setAddresses(data);
        if (data.length > 0) {
          const defaultAddr = data.find((a) => a.isDefault) || data[0];
          setSelectedAddressId(defaultAddr.id);
        } else {
          setShowNewAddress(true);
        }
      })
      .catch(console.error);
  }, [items, navigate]);

  const subtotal = getSubtotal();
  const shipping = subtotal >= 2000 ? 0 : 150;
  const total = subtotal + shipping;

  // Group items by seller
  const itemsBySeller: Record<string, typeof items> = {};
  items.forEach((item) => {
    const sName = item.sellerName || 'Independent Studio';
    if (!itemsBySeller[sName]) itemsBySeller[sName] = [];
    itemsBySeller[sName].push(item);
  });

  const handlePlaceOrder = async () => {
    setLoading(true);
    setStockError(null);

    const payload: any = {
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      paymentMethod,
    };

    if (showNewAddress || !selectedAddressId) {
      payload.newAddress = {
        fullName: newFullName,
        phone: newPhone,
        addressLine1: newLine1,
        city: newCity,
        state: newState,
        postalCode: newPostal,
        country: 'India',
        isDefault: true,
      };
    } else {
      payload.addressId = selectedAddressId;
    }

    try {
      const order = await api.buyer.checkout(payload);
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-success/${order.id}`, { state: { order } });
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Insufficient stock error!
        const msg = err.response.data.message || 'One or more items in your cart is no longer available in the requested quantity.';
        setStockError(msg);
        toast.error('Stock Unavailable', { description: msg, duration: 8000 });
      } else {
        const msg = err.response?.data?.message || 'Checkout failed. Please try again.';
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Checkout Progress Stepper */}
      <div className="flex items-center justify-between max-w-xl mx-auto text-xs font-bold">
        <div
          className={`flex items-center gap-2 cursor-pointer ${
            step >= 1 ? 'text-primary' : 'text-muted-foreground'
          }`}
          onClick={() => setStep(1)}
        >
          <span className="w-6 h-6 rounded-full bg-surface-200 dark:bg-surface-100 flex items-center justify-center">
            1
          </span>
          <span>Delivery Address</span>
        </div>
        <div className="flex-1 h-0.5 bg-border mx-4" />
        <div
          className={`flex items-center gap-2 cursor-pointer ${
            step >= 2 ? 'text-primary' : 'text-muted-foreground'
          }`}
          onClick={() => setStep(2)}
        >
          <span className="w-6 h-6 rounded-full bg-surface-200 dark:bg-surface-100 flex items-center justify-center">
            2
          </span>
          <span>Order Review</span>
        </div>
        <div className="flex-1 h-0.5 bg-border mx-4" />
        <div
          className={`flex items-center gap-2 cursor-pointer ${
            step >= 3 ? 'text-primary' : 'text-muted-foreground'
          }`}
          onClick={() => setStep(3)}
        >
          <span className="w-6 h-6 rounded-full bg-surface-200 dark:bg-surface-100 flex items-center justify-center">
            3
          </span>
          <span>Payment</span>
        </div>
      </div>

      {stockError && (
        <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="flex-1 font-semibold">{stockError}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Flow Area */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: Shipping Address */}
          {step === 1 && (
            <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" /> Delivery Destination
                </h2>
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowNewAddress(!showNewAddress)}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {showNewAddress ? 'Select Existing' : 'Add New Address'}
                  </button>
                )}
              </div>

              {!showNewAddress && addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedAddressId === addr.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border bg-surface-100 dark:bg-surface-200/40 hover:border-foreground/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{addr.fullName}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] uppercase font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {addr.addressLine1}, {addr.city}, {addr.state} — {addr.postalCode}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Phone: {addr.phone}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-muted-foreground mb-1">Full Recipient Name</label>
                    <input
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-muted-foreground mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-muted-foreground mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={newPostal}
                        onChange={(e) => setNewPostal(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-muted-foreground mb-1">Street Address</label>
                    <input
                      type="text"
                      value={newLine1}
                      onChange={(e) => setNewLine1(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-muted-foreground mb-1">City</label>
                      <input
                        type="text"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-muted-foreground mb-1">State</label>
                      <input
                        type="text"
                        value={newState}
                        onChange={(e) => setNewState(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3.5 bg-primary text-primary-foreground text-xs font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary-hover shadow-md shadow-primary/25"
              >
                <span>Continue to Order Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Multi-Vendor Order Review */}
          {step === 2 && (
            <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" /> Multi-Vendor Order Breakdown
                </h2>
                <span className="text-xs text-muted-foreground">
                  {Object.keys(itemsBySeller).length} Independent Creators
                </span>
              </div>

              <div className="space-y-6">
                {Object.entries(itemsBySeller).map(([sellerName, sellerItems]) => (
                  <div key={sellerName} className="p-4 rounded-2xl bg-surface-100 dark:bg-surface-200/40 border border-border/60 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground border-b border-border/60 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-primary" />
                        <span>Fulfillment by: {sellerName}</span>
                      </div>
                      <span className="text-emerald-500">Direct Studio Shipping</span>
                    </div>

                    <div className="space-y-2">
                      {sellerItems.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                              <p className="font-semibold text-foreground">{item.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-foreground">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3.5 bg-surface-100 dark:bg-surface-200 text-foreground text-xs font-bold rounded-2xl border border-border"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-2/3 py-3.5 bg-primary text-primary-foreground text-xs font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary-hover shadow-md shadow-primary/25"
                >
                  <span>Select Payment Method</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Method & Execution */}
          {step === 3 && (
            <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-6 shadow-sm">
              <h2 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Simulated Secure Payment
              </h2>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                  className={`p-3.5 rounded-2xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'CREDIT_CARD'
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-border bg-surface-100 dark:bg-surface-200/40 text-muted-foreground'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3.5 rounded-2xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'UPI'
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-border bg-surface-100 dark:bg-surface-200/40 text-muted-foreground'
                  }`}
                >
                  <span className="font-extrabold text-sm font-mono">UPI</span>
                  <span>Instant Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('NET_BANKING')}
                  className={`p-3.5 rounded-2xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'NET_BANKING'
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-border bg-surface-100 dark:bg-surface-200/40 text-muted-foreground'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  <span>Net Banking</span>
                </button>
              </div>

              {paymentMethod === 'CREDIT_CARD' && (
                <div className="p-4 rounded-2xl bg-surface-100 dark:bg-surface-200/50 border border-border space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Simulated Card</label>
                    <input
                      type="text"
                      readOnly
                      value={cardNumber}
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1">Expiry</label>
                      <input
                        type="text"
                        readOnly
                        value="12/28"
                        className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1">CVV</label>
                      <input
                        type="password"
                        readOnly
                        value="999"
                        className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Sandbox payment active. No real card will be charged.</span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3.5 bg-surface-100 dark:bg-surface-200 text-foreground text-xs font-bold rounded-2xl border border-border"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-2/3 py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Verifying Stock & Deducting...</span>
                  ) : (
                    <>
                      <span>Authorize Payment & Place Order (₹{total.toFixed(2)})</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Order Summary */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 p-6 rounded-3xl bg-card border border-border/80 space-y-4 shadow-sm">
            <h3 className="text-base font-bold font-display text-foreground pb-2 border-b border-border/60">
              Summary ({items.length} works)
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-emerald-500 font-bold">Complimentary</span>
                  ) : (
                    `₹${shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="pt-3 border-t border-border/60 flex justify-between text-sm">
                <span className="font-bold text-foreground">Total</span>
                <span className="text-lg font-extrabold font-display text-primary">
                  ₹{total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-100 dark:bg-surface-200/50 text-[11px] text-muted-foreground space-y-1">
              <p className="font-bold text-foreground">Multi-Vendor Concurrency Safeguard</p>
              <p>Items reserved atomically upon payment click with strict stock decrement isolation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
