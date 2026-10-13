import React, { useEffect, useState } from 'react';
import {
  KanbanSquare,
  Table as TableIcon,
  CheckCircle2,
  Package,
  Truck,
  CheckCheck,
  ChevronRight,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { api } from '../../api/client';
import { OrderItem, OrderStatus } from '../../types';
import { toast } from 'sonner';

export const SellerOrdersPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Status update in progress
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.seller.getOrders({ size: 100 });
      setOrderItems(res.content);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load seller orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAdvanceStatus = async (item: OrderItem, nextStatus: OrderStatus) => {
    setUpdatingId(item.id);
    try {
      await api.seller.updateOrderItemStatus(item.id, nextStatus, `Updated by store on Kanban board`);
      setOrderItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, itemStatus: nextStatus } : i))
      );
      toast.success(`Advanced #${item.orderNumber} to ${nextStatus}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update item status');
    } finally {
      setUpdatingId(null);
    }
  };

  const kanbanColumns: {
    status: OrderStatus;
    title: string;
    icon: any;
    color: string;
    next?: OrderStatus;
    nextLabel?: string;
  }[] = [
    {
      status: 'PLACED',
      title: 'New Orders',
      icon: Clock,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      next: 'CONFIRMED',
      nextLabel: 'Confirm Order',
    },
    {
      status: 'CONFIRMED',
      title: 'Confirmed',
      icon: CheckCircle2,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      next: 'PACKED',
      nextLabel: 'Pack & Seal',
    },
    {
      status: 'PACKED',
      title: 'Packed',
      icon: Package,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      next: 'SHIPPED',
      nextLabel: 'Dispatch Courier',
    },
    {
      status: 'SHIPPED',
      title: 'Shipped',
      icon: Truck,
      color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
      next: 'DELIVERED',
      nextLabel: 'Mark Delivered',
    },
    {
      status: 'DELIVERED',
      title: 'Delivered',
      icon: CheckCheck,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground">Order Fulfillment Workspace</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Process orders containing your creations. Updates sync live across buyer timeline and admin feeds.
          </p>
        </div>

        {/* View Switcher */}
        <div className="p-1.5 rounded-2xl bg-surface-100 dark:bg-surface-200 border border-border flex items-center gap-1 self-start sm:self-auto text-xs">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'kanban'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <KanbanSquare className="w-3.5 h-3.5 text-primary" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'table'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5 text-primary" />
            <span>Table View</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const itemsInCol = orderItems.filter((i) => i.itemStatus === col.status);
            const Icon = col.icon;

            return (
              <div
                key={col.status}
                className="bg-card/70 border border-border/80 rounded-3xl p-4 flex flex-col min-w-[240px] shadow-sm"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg border ${col.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="text-xs font-bold font-display text-foreground">{col.title}</h3>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-surface-200 dark:bg-surface-100 text-[10px] font-bold text-foreground flex items-center justify-center">
                    {itemsInCol.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                  {itemsInCol.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-surface-100 dark:bg-surface-200/40 border border-border/60 hover:border-primary/40 space-y-3 text-xs shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-primary truncate max-w-[120px]">
                          {item.orderNumber}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover shrink-0 bg-surface-200"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-foreground truncate">{item.productName}</p>
                          <p className="text-[11px] text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                        <span className="font-bold text-foreground font-display">
                          ₹{item.subtotal.toFixed(2)}
                        </span>

                        {col.next && (
                          <button
                            onClick={() => handleAdvanceStatus(item, col.next!)}
                            disabled={updatingId === item.id}
                            className="px-2.5 py-1 rounded-xl bg-primary hover:bg-primary-hover text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all disabled:opacity-50"
                          >
                            <span>{col.nextLabel}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {itemsInCol.length === 0 && (
                    <div className="py-8 text-center text-[11px] text-muted-foreground border border-dashed border-border/60 rounded-2xl">
                      No orders in this phase
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW 2: TABLE VIEW */
        <div className="rounded-3xl bg-card border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-100 dark:bg-surface-200/60 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Subtotal</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right">Update Phase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-foreground">
                {orderItems.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-100/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">{item.orderNumber}</td>
                    <td className="py-3.5 px-4 font-semibold">{item.productName}</td>
                    <td className="py-3.5 px-4">{item.quantity}</td>
                    <td className="py-3.5 px-4 font-mono font-bold">₹{item.subtotal.toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[10px] bg-primary/10 text-primary">
                        {item.itemStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={item.itemStatus}
                        onChange={(e) => handleAdvanceStatus(item, e.target.value as OrderStatus)}
                        className="bg-surface-100 dark:bg-surface-200 text-foreground px-2.5 py-1 rounded-xl border border-border font-bold text-xs cursor-pointer"
                      >
                        <option value="PLACED">PLACED</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PACKED">PACKED</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
