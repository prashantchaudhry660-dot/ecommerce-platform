import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Boxes,
  KanbanSquare,
  BarChart3,
  Plus,
  ArrowUpRight,
  AlertCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../api/client';
import { SellerAnalytics, InventoryAlert, OrderItem } from '../../types';
import { useAuthStore } from '../../store/authStore';

export const SellerDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [lowStock, setLowStock] = useState<InventoryAlert[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.seller.getAnalytics(30).then(setAnalytics),
      api.seller.getLowStock(5).then(setLowStock),
      api.seller.getOrders({ size: 5 }).then((res) => setRecentOrders(res.content)),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="p-8 rounded-4xl bg-gradient-to-r from-primary/10 via-card to-accent/10 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <div>
          <span className="px-3 py-1 bg-primary/20 text-primary text-[11px] font-extrabold uppercase tracking-wider rounded-full">
            Store Command Center
          </span>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-foreground mt-2">
            {user?.fullName} Workspace
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time multi-vendor store metrics, order processing, and stock levels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/seller/products"
            className="px-5 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Store Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold font-display text-foreground">
            ₹{(analytics?.totalRevenue || 0).toFixed(2)}
          </p>
          <p className="text-[11px] text-muted-foreground">Computed across completed line items</p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Orders Containing Store Items</span>
            <KanbanSquare className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-extrabold font-display text-foreground">
            {analytics?.totalOrders || 0}
          </p>
          <p className="text-[11px] text-muted-foreground">Multi-vendor split line items</p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Active Catalog Works</span>
            <Package className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold font-display text-foreground">
            {analytics?.totalProducts || 0}
          </p>
          <p className="text-[11px] text-muted-foreground">Live approved product listings</p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Low Stock Alerts</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold font-display text-amber-500">
            {lowStock.length}
          </p>
          <p className="text-[11px] text-muted-foreground">Products at or below threshold (5)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <h3 className="text-base font-bold font-display text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Recent Orders to Fulfill
            </h3>
            <Link to="/seller/orders" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>View Kanban Board</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No orders containing your items have been placed yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-surface-100 dark:bg-surface-200/50 border border-border/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img src={item.productImage} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    <div>
                      <p className="font-bold text-foreground">{item.productName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Order #{item.orderNumber} • Qty: {item.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="font-bold text-foreground block">₹{item.subtotal.toFixed(2)}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary/10 text-primary">
                      {item.itemStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts Box */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <h3 className="text-base font-bold font-display text-foreground flex items-center gap-2">
              <Boxes className="w-4 h-4 text-amber-500" /> Stock Watch
            </h3>
            <Link to="/seller/inventory" className="text-xs font-bold text-primary hover:underline">
              Manage
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              All inventory levels are currently healthy!
            </div>
          ) : (
            <div className="space-y-3">
              {lowStock.map((prod) => (
                <div
                  key={prod.productId}
                  className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-foreground truncate">{prod.productName}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">SKU: {prod.sku}</p>
                  </div>
                  <span className="font-extrabold text-amber-500 px-2 py-1 rounded-lg bg-amber-500/20 shrink-0">
                    {prod.stock} units
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
