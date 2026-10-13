import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  CheckCheck,
  Store,
  ChevronLeft,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { api } from '../../api/client';
import { Order, OrderStatus } from '../../types';

export const OrderTrackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    api.buyer
      .getOrder(Number(id))
      .then(setOrder)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !order) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const milestones: { key: OrderStatus; label: string; icon: any }[] = [
    { key: 'PLACED', label: 'Order Placed', icon: Clock },
    { key: 'CONFIRMED', label: 'Confirmed by Seller', icon: CheckCircle2 },
    { key: 'PACKED', label: 'Packed & Sealed', icon: Package },
    { key: 'SHIPPED', label: 'Dispatched from Studio', icon: Truck },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
    { key: 'DELIVERED', label: 'Successfully Delivered', icon: CheckCheck },
  ];

  const statusOrder: OrderStatus[] = [
    'PLACED',
    'CONFIRMED',
    'PACKED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ];

  const currentIdx = statusOrder.indexOf(order.overallStatus);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div className="space-y-1">
          <Link
            to="/account"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1 font-semibold"
          >
            <ChevronLeft className="w-4 h-4" /> Back to My Orders
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-foreground">
            Order Tracking: <span className="text-primary font-mono">{order.orderNumber}</span>
          </h1>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Overall Status
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            {order.overallStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Animated Vertical Timeline */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-6">
            <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Delivery Progression
            </h2>

            {/* Stepper Pipeline */}
            <div className="relative pl-6 space-y-8 before:absolute before:left-[17px] before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
              {milestones.map((m, idx) => {
                const Icon = m.icon;
                const isPassed = currentIdx >= idx;
                const isCurrent = currentIdx === idx;

                // Find corresponding history log if exists
                const matchingHistory = order.statusHistories.find(
                  (h) => h.status.toUpperCase() === m.key
                );

                return (
                  <div key={m.key} className="relative flex items-start gap-4">
                    {/* Step Icon Node */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 -ml-[23px] transition-all z-10 ${
                        isCurrent
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-primary/20 scale-110'
                          : isPassed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-surface-200 dark:bg-surface-100 text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0 -mt-1">
                      <div className="flex items-baseline justify-between">
                        <h4
                          className={`text-sm font-bold ${
                            isCurrent
                              ? 'text-primary'
                              : isPassed
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {m.label}
                        </h4>
                        {matchingHistory && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(matchingHistory.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      {matchingHistory && (
                        <div className="mt-1 p-2 rounded-xl bg-surface-100 dark:bg-surface-200/50 border border-border/60 text-xs text-muted-foreground">
                          <p>{matchingHistory.notes || 'Status confirmed on platform'}</p>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-foreground font-semibold">
                            <UserCheck className="w-3 h-3 text-primary" />
                            <span>Action recorded by: {matchingHistory.changedByName}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Items and Address Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold font-display text-foreground pb-2 border-b border-border/60">
              Package Item Statuses ({order.items.length})
            </h3>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-surface-100 dark:bg-surface-200/40 border border-border/60 space-y-2 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        item.productImage ||
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80'
                      }
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{item.productName}</p>
                      <p className="text-[11px] text-muted-foreground">Store: {item.sellerName}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                    <span className="text-muted-foreground">
                      Qty: {item.quantity} • ₹{item.unitPrice.toFixed(2)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary uppercase">
                      {item.itemStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {order.shippingAddress && (
              <div className="pt-4 border-t border-border/60 text-xs space-y-1">
                <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider block">
                  Delivery Destination
                </span>
                <p className="font-semibold text-foreground">{order.shippingAddress.fullName}</p>
                <p className="text-muted-foreground">
                  {order.shippingAddress.addressLine1}, {order.shippingAddress.city},{' '}
                  {order.shippingAddress.state} — {order.shippingAddress.postalCode}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
