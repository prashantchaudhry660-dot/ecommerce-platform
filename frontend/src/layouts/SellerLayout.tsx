import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  KanbanSquare,
  BarChart3,
  Store,
  Sun,
  Moon,
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useSellerOrderStream } from '../hooks/useSse';
import { toast } from 'sonner';

export const SellerLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [collapsed, setCollapsed] = useState(false);
  const [sseActive, setSseActive] = useState(true);

  // Hook into live Seller Order SSE stream
  useSellerOrderStream((event) => {
    setSseActive(true);
    if (event.type === 'NEW_ORDER_ALERT') {
      toast.success(`⚡ New Order Received! Order #${event.data.orderNumber} with ${event.data.totalItems} items`, {
        description: 'New multi-vendor line items require fulfillment.',
        duration: 8000,
      });
    } else if (event.type === 'ITEM_STATUS_UPDATED') {
      toast.info(`Item status updated: ${event.data.productName} -> ${event.data.itemStatus}`);
    }
  });

  const navItems = [
    { label: 'Overview', path: '/seller', icon: LayoutDashboard },
    { label: 'Product Listings', path: '/seller/products', icon: Package },
    { label: 'Inventory Monitor', path: '/seller/inventory', icon: Boxes },
    { label: 'Order Processing', path: '/seller/orders', icon: KanbanSquare },
    { label: 'Sales Performance', path: '/seller/analytics', icon: BarChart3 },
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
            <Link to="/seller" className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center text-white shrink-0 shadow-md shadow-primary/30">
                <Store className="w-5 h-5" />
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-base font-display text-foreground tracking-tight">
                    Passu<span className="text-primary">.</span>Studio
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold truncate">
                    Seller Workspace
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

          {/* Store Info Pill */}
          {!collapsed && (
            <div className="px-4 py-3 m-3 rounded-2xl bg-surface-100 dark:bg-surface-200/60 border border-border/80">
              <p className="text-xs font-bold text-foreground truncate">{user?.fullName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-500 font-semibold">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>SSE Stream Connected</span>
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
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
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
            {!collapsed && <span>Visit Marketplace</span>}
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

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display text-foreground">
              {navItems.find((n) => n.path === location.pathname)?.label || 'Seller Studio'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Order Feed</span>
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
