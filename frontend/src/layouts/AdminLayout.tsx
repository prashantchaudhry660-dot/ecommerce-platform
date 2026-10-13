import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  PackageCheck,
  ClipboardList,
  Activity,
  Sun,
  Moon,
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Radio,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useAdminActivityStream } from '../hooks/useSse';
import { toast } from 'sonner';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [collapsed, setCollapsed] = useState(false);

  // Hook into live Admin Platform Activity SSE stream
  useAdminActivityStream((event) => {
    if (event.type === 'ACTIVITY_LOG') {
      toast.info(`🔔 System Activity: ${event.data.action}`, {
        description: `${event.data.details || ''} (${event.data.userEmail || 'System'})`,
        duration: 5000,
      });
    } else if (event.type === 'ORDER_PLACED') {
      toast.success(`⚡ Platform Order Placed: #${event.data.orderNumber}`, {
        description: `Total: ₹${event.data.totalAmount} by ${event.data.buyerName}`,
        duration: 6000,
      });
    } else if (event.type === 'PRODUCT_MODERATED') {
      toast.warning(`Product Moderation: ${event.data.name} is ${event.data.moderationStatus}`);
    }
  });

  const navItems = [
    { label: 'Overview & KPIs', path: '/admin', icon: Activity },
    { label: 'User Management', path: '/admin/users', icon: Users },
    { label: 'Product Moderation', path: '/admin/products', icon: PackageCheck },
    { label: 'Platform Orders', path: '/admin/orders', icon: ClipboardList },
    { label: 'Live Activity Stream', path: '/admin/activity', icon: Radio },
  ];

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`sticky top-0 h-screen bg-card border-r border-border flex flex-col justify-between transition-all duration-300 z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Logo Bar */}
          <div className="p-5 flex items-center justify-between border-b border-border/80">
            <Link to="/admin" className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center font-bold shrink-0 shadow-md">
                <Shield className="w-5 h-5" />
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-base font-display text-foreground tracking-tight">
                    Passu<span className="text-accent">.Admin</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold truncate">
                    Platform Governance
                  </span>
                </div>
              )}
            </Link>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-200 dark:hover:bg-surface-100 transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Admin Identity Pill */}
          {!collapsed && (
            <div className="px-4 py-3 m-3 rounded-2xl bg-surface-100 dark:bg-surface-200/60 border border-border/80">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground truncate">{user?.fullName}</p>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-accent/20 text-accent-foreground">
                  SuperAdmin
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-500 font-semibold">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>SSE Stream Broadcast Active</span>
              </div>
            </div>
          )}

          {/* Nav Items */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-foreground text-background shadow-md scale-[1.02]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-100 dark:hover:bg-surface-200'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-border/80 space-y-1">
          <Link
            to="/catalog"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-100 dark:hover:bg-surface-200 transition-colors"
            title={collapsed ? 'Public Catalog' : undefined}
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Marketplace View</span>}
          </Link>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-100 dark:hover:bg-surface-200 transition-colors"
            title={collapsed ? 'Toggle Theme' : undefined}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 text-indigo-400 shrink-0" />}
            {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace Body */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display text-foreground">
              {navItems.find((n) => n.path === location.pathname)?.label || 'Platform Governance'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-xs font-semibold border border-accent/40">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <span>Realtime Platform SSE Active</span>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl w-full mx-auto flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
