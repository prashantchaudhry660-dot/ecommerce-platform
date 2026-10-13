import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { TrendingUp, Calendar, DollarSign, PackageCheck, BarChart2 } from 'lucide-react';
import { api } from '../../api/client';
import { SellerAnalytics } from '../../types';
import { toast } from 'sonner';

export const SellerAnalyticsPage: React.FC = () => {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<SellerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.seller
      .getAnalytics(days)
      .then(setData)
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load analytics');
      })
      .finally(() => setLoading(false));
  }, [days]);

  const COLORS = ['#7C5CFF', '#C6FF3D', '#38BDF8', '#F59E0B', '#10B981', '#EC4899'];

  const formattedChart = (data?.salesChart || []).map((p) => ({
    date: p.date,
    revenue: Number(p.revenue),
    orders: p.orders,
  }));

  const donutData = (data?.ordersByStatus || []).map((s) => ({
    name: s.status,
    value: s.count,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground">Sales Performance & Analytics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Aggregated revenue metrics and volume trends computed directly from database orders.
          </p>
        </div>

        {/* 7d / 30d / 90d Filter */}
        <div className="p-1 rounded-2xl bg-surface-100 dark:bg-surface-200 border border-border flex items-center gap-1 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setDays(7)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              days === 7
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDays(30)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              days === 30
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDays(90)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              days === 90
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Period Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold font-display text-foreground">
            ₹{(data?.totalRevenue || 0).toFixed(2)}
          </p>
          <p className="text-[11px] text-muted-foreground">Excludes cancelled line items</p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Distinct Orders</span>
            <PackageCheck className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-extrabold font-display text-foreground">
            {data?.totalOrders || 0}
          </p>
          <p className="text-[11px] text-muted-foreground">Orders containing your store items</p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Average Order Value</span>
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
          <p className="text-3xl font-extrabold font-display text-foreground">
            ₹{data && data.totalOrders > 0 ? (data.totalRevenue / data.totalOrders).toFixed(2) : '0.00'}
          </p>
          <p className="text-[11px] text-muted-foreground">Store basket size efficiency</p>
        </div>
      </div>

      {/* Main Revenue Area Chart with Gradient */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" /> Revenue Velocity Over Time
          </h3>
          <span className="text-xs text-muted-foreground font-semibold">
            {days}-day SQL aggregates
          </span>
        </div>

        <div className="h-72 w-full">
          {formattedChart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              No sales data recorded in this timeframe yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(18, 19, 29, 0.9)',
                    borderRadius: '12px',
                    border: '1px solid #272A3D',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7C5CFF"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grid: Top Products + Orders by Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Products */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <h3 className="text-base font-bold font-display text-foreground">Top Performing Products</h3>
          {data?.topProducts && data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((p, idx) => (
                <div
                  key={p.productName}
                  className="p-3 rounded-2xl bg-surface-100 dark:bg-surface-200/40 border border-border/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-surface-200 text-muted-foreground font-bold flex items-center justify-center text-[11px]">
                      #{idx + 1}
                    </span>
                    <p className="font-bold text-foreground">{p.productName}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground block">₹{p.totalRevenue.toFixed(2)}</span>
                    <span className="text-[11px] text-muted-foreground">{p.unitsSold} units dispatched</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Top products will rank automatically once orders are fulfilled.
            </div>
          )}
        </div>

        {/* Orders by Status Donut */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <h3 className="text-base font-bold font-display text-foreground">Orders by Status</h3>
          <div className="h-60 w-full flex items-center justify-center">
            {donutData.length === 0 ? (
              <span className="text-xs text-muted-foreground">No order distribution data</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(18, 19, 29, 0.9)',
                      borderRadius: '12px',
                      border: '1px solid #272A3D',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-center pt-2 text-[11px]">
            {donutData.map((d, idx) => (
              <div key={d.name} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-200">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="font-semibold text-foreground">{d.name}:</span>
                <span className="font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
