import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, ArrowRight, Package, Store, Clock } from 'lucide-react';
import { api } from '../../api/client';
import { Order } from '../../types';

export const OrderSuccessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>((location.state as any)?.order || null);

  useEffect(() => {
    // Fire celebratory confetti burst!
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7C5CFF', '#C6FF3D', '#FFFFFF', '#6366F1'],
      });
    } catch {
      // ignore
    }

    if (!order && id) {
      api.buyer.getOrder(Number(id)).then(setOrder).catch(console.error);
    }
  }, [id, order]);

  if (!order) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Count distinct sellers
  const distinctSellers = Array.from(new Set(order.items.map((i) => i.sellerName)));

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-8 animate-fade-in">
      {/* Success Badge */}
      <div className="space-y-3">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-foreground">
          Order Confirmed!
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Thank you for supporting independent creator ateliers. Your items are being prepared for fulfillment.
        </p>
      </div>

      {/* Order Ticket Card */}
      <div className="p-6 rounded-3xl bg-card border border-border/80 text-left space-y-4 shadow-lg glass-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 gap-2">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Order Reference
            </span>
            <p className="text-base font-extrabold font-mono text-primary">{order.orderNumber}</p>
          </div>
          <div className="sm:text-right">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Overall Status
            </span>
            <p className="text-xs font-bold text-emerald-500 uppercase">{order.overallStatus}</p>
          </div>
        </div>

        {/* Multi-Vendor Alert */}
        <div className="p-3.5 rounded-2xl bg-surface-100 dark:bg-surface-200/50 border border-border text-xs flex items-center gap-3">
          <Store className="w-5 h-5 text-primary shrink-0" />
          <div className="text-muted-foreground">
            This order contains items across{' '}
            <span className="font-bold text-foreground">{distinctSellers.length} separate creator stores</span>.
            Line items will be independently dispatched.
          </div>
        </div>

        {/* Item Summaries */}
        <div className="space-y-3 pt-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={item.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80'}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                />
                <div>
                  <p className="font-bold text-foreground">{item.productName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Store: <span className="font-medium text-foreground">{item.sellerName}</span> • Qty: {item.quantity}
                  </p>
                </div>
              </div>
              <span className="font-extrabold text-foreground">₹{item.subtotal.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border/60 flex items-center justify-between text-sm">
          <span className="font-bold text-muted-foreground">Total Authorized</span>
          <span className="text-xl font-extrabold font-display text-primary">₹{order.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* CTA Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          to={`/orders/${order.id}/track`}
          className="w-full sm:w-auto px-6 py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs rounded-2xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:scale-105 transition-all"
        >
          <Clock className="w-4 h-4" />
          <span>Track Order Milestones & Timeline</span>
        </Link>
        <Link
          to="/catalog"
          className="w-full sm:w-auto px-6 py-3.5 bg-surface-100 dark:bg-surface-200 text-foreground font-bold text-xs rounded-2xl border border-border hover:bg-surface-200 transition-colors"
        >
          Continue Browsing
        </Link>
      </div>
    </div>
  );
};
