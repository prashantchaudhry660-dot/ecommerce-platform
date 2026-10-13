import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
  Store,
} from 'lucide-react';
import { api } from '../../api/client';
import { Order, OrderStatus, PageResponse } from '../../types';
import { toast } from 'sonner';

export const AdminOrdersPage: React.FC = () => {
  const [ordersPage, setOrdersPage] = useState<PageResponse<Order> | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Status Override Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<OrderStatus>('PLACED');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getOrders({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        size: 15,
      });
      setOrdersPage(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load platform orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, search, page]);

  const openOverrideModal = (o: Order) => {
    setSelectedOrder(o);
    setOverrideStatus(o.overallStatus);
    setOverrideNotes('');
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      await api.admin.updateOrderStatus(selectedOrder.id, overrideStatus, overrideNotes);
      toast.success(`Order ${selectedOrder.orderNumber} status changed to ${overrideStatus}`);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update order status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground">Platform Orders Oversight</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            View all multi-vendor orders, item breakdowns, seller stores, and execute status overrides.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(0);
            }}
            className="bg-surface-100 dark:bg-surface-200 text-foreground px-3 py-2 rounded-2xl border border-border text-xs font-bold"
          >
            <option value="">All Statuses</option>
            <option value="PLACED">PLACED</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PACKED">PACKED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search order ref or buyer..."
              className="pl-9 pr-3 py-2 rounded-2xl bg-surface-100 dark:bg-surface-200 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl bg-card border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-100 dark:bg-surface-200/60 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Buyer</th>
                <th className="py-3 px-4">Items / Sellers</th>
                <th className="py-3 px-4">Total (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-foreground">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Loading orders...
                  </td>
                </tr>
              ) : ordersPage && ordersPage.content.length > 0 ? (
                ordersPage.content.map((o) => {
                  const sellers = Array.from(new Set(o.items.map((i) => i.sellerName)));
                  return (
                    <tr key={o.id} className="hover:bg-surface-100/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">{o.orderNumber}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-foreground">{o.buyerName}</p>
                        <p className="text-[11px] text-muted-foreground">{o.buyerEmail}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold block">{o.items.length} item(s)</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {sellers.map((s) => (
                            <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold font-mono">₹{o.totalAmount.toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500">
                          {o.overallStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openOverrideModal(o)}
                          className="px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-200 text-foreground font-bold hover:bg-surface-200 border border-border"
                        >
                          Override
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No platform orders recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedOrder(null)}>
          <div
            className="w-full max-w-lg bg-card border border-border p-6 rounded-3xl shadow-2xl glass-panel space-y-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h3 className="text-base font-bold font-display text-foreground">
                Override Status for #{selectedOrder.orderNumber}
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-muted-foreground mb-1">Select New Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground font-bold"
                >
                  <option value="PLACED">PLACED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PACKED">PACKED</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1">Administrative Notes</label>
                <textarea
                  rows={2}
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="Reason for administrative intervention..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 text-foreground font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold disabled:opacity-50"
                >
                  {submitting ? 'Applying...' : 'Apply Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
