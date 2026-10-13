import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  Shield,
  Users,
  Store,
  Package,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Radio,
  Clock,
} from 'lucide-react';
import { api } from '../../api/client';
import { AdminMetrics, ActivityLog } from '../../types';
import { useAdminActivityStream } from '../../hooks/useSse';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = () => {
    api.admin.getMetrics().then(setMetrics).catch(console.error);
    api.admin.getActivity({ size: 8 }).then((res) => setRecentActivities(res.content)).catch(console.error);
  };

  useEffect(() => {
    setLoading(true);
    fetchMetrics();
    setLoading(false);
  }, []);

  // Listen to live SSE events and prepend to recent activities!
  useAdminActivityStream((event) => {
    if (event.type === 'ACTIVITY_LOG') {
      setRecentActivities((prev) => [event.data, ...prev.slice(0, 15)]);
      // refresh metrics on orders/users
      fetchMetrics();
    } else if (event.type === 'ORDER_PLACED') {
      fetchMetrics();
    }
  });

  const sparklineData = (metrics?.gmvTrend || []).map((p) => ({
    date: p.date,
    gmv: Number(p.value),
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Governance Hero */}
      <div className="p-8 rounded-4xl bg-gradient-to-r from-accent/20 via-card to-primary/10 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <div>
          <span className="px-3 py-1 bg-accent/30 text-accent-foreground text-[11px] font-extrabold uppercase tracking-wider rounded-full">
            Global Admin Governance
          </span>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-foreground mt-2">
            Platform Operations & Intelligence
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time multi-vendor oversight, live Server-Sent Events monitoring, and catalog moderation.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold">
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Live SSE Activity Stream Active</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Platform GMV</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold font-display text-foreground">
            ₹{(metrics?.gmv || 0).toFixed(2)}
          </p>
          <p className="text-[11px] text-muted-foreground">Cumulative gross merchandise value</p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Orders Today</span>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-extrabold font-display text-foreground">
            {metrics?.ordersToday || 0}
          </p>
          <p className="text-[11px] text-muted-foreground">Dispatched across independent vendors</p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Verified Sellers</span>
            <Store className="w-4 h-4 text-accent" />
          </div>
          <p className="text-3xl font-extrabold font-display text-foreground">
            {metrics?.totalSellers || 0}
          </p>
          <p className="text-[11px] text-muted-foreground">Independent boutique studios</p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Registered Users</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold font-display text-foreground">
            {metrics?.totalUsers || 0}
          </p>
          <p className="text-[11px] text-muted-foreground">Buyers and creators combined</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* GMV 7-Day Sparkline Chart */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-foreground">7-Day Platform GMV Velocity</h3>
            <span className="text-xs text-muted-foreground">Live Database Aggregates</span>
          </div>

          <div className="h-64 w-full">
            {sparklineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No orders completed in the last 7 days yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C6FF3D" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#C6FF3D" stopOpacity={0.0} />
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
                    dataKey="gmv"
                    stroke="#C6FF3D"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorGmv)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Live SSE System Feed Ticker */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="text-base font-bold font-display text-foreground">Live System Activity Feed</h3>
            </div>
            <Link to="/admin/activity" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {recentActivities.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No activity records logged yet.
              </div>
            ) : (
              recentActivities.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-surface-100 dark:bg-surface-200/40 border border-border/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-primary/10 text-primary">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-foreground font-medium">{log.details || log.action}</p>
                  <p className="text-[10px] text-muted-foreground">User: {log.userEmail || 'System'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
