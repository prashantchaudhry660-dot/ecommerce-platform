import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowUpRight, ShieldCheck, Truck, RefreshCcw, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-24 border-t border-border bg-card/40 backdrop-blur-sm">
      {/* Editorial Value Props Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-border/60">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-surface-100 dark:bg-surface-200 text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Verified Independent Stores</h4>
              <p className="text-xs text-muted-foreground">Every seller vetted manually</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-surface-100 dark:bg-surface-200 text-accent">
              <Truck className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Multi-Vendor Splitting</h4>
              <p className="text-xs text-muted-foreground">Single checkout, separate dispatches</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-surface-100 dark:bg-surface-200 text-amber-500">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Atomic Stock Assurance</h4>
              <p className="text-xs text-muted-foreground">Zero overselling guarantee</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-surface-100 dark:bg-surface-200 text-rose-500">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Direct Artisan Support</h4>
              <p className="text-xs text-muted-foreground">Empowering boutique ateliers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Editorial Manifesto */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand Manifesto */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                <Sparkles className="w-4 h-4 text-accent-foreground" />
              </div>
              <span className="text-2xl font-extrabold font-display tracking-tight text-foreground">
                Passu<span className="text-primary">.</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              An architectural reimagination of contemporary commerce. We curate progressive designers and independent artisans into a cohesive, high-performance marketplace.
            </p>
            <div className="text-xs text-muted-foreground">
              Designed & Built with Spring Boot 3, React 18, and MySQL 8.
            </div>
          </div>

          {/* Catalog Columns */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">Explore</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/catalog" className="hover:text-foreground">All Products</Link></li>
              <li><Link to="/catalog?category=Ceramics" className="hover:text-foreground">Ceramics</Link></li>
              <li><Link to="/catalog?category=Furniture" className="hover:text-foreground">Furniture</Link></li>
              <li><Link to="/catalog?category=Lighting" className="hover:text-foreground">Lighting</Link></li>
              <li><Link to="/catalog?category=Apparel" className="hover:text-foreground">Apparel</Link></li>
            </ul>
          </div>

          {/* Creators & Platform */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">Vendors</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/register" className="hover:text-foreground flex items-center gap-1">Open Studio <ArrowUpRight className="w-3 h-3" /></Link></li>
              <li><Link to="/seller" className="hover:text-foreground">Seller Workspace</Link></li>
              <li><Link to="/seller/inventory" className="hover:text-foreground">Inventory Monitor</Link></li>
              <li><Link to="/seller/analytics" className="hover:text-foreground">Analytics Suite</Link></li>
            </ul>
          </div>

          {/* Admin & Security */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">Platform Governance</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/admin" className="hover:text-foreground flex items-center gap-1">Admin Command Center <ArrowUpRight className="w-3 h-3" /></Link></li>
              <li><Link to="/admin/activity" className="hover:text-foreground">Realtime Activity Feed</Link></li>
              <li><Link to="/admin/products" className="hover:text-foreground">Moderation Engine</Link></li>
              <li><span className="text-xs text-emerald-500 font-semibold flex items-center gap-1.5 mt-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> SSE Event Stream Active</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2025 Passu Inc. All rights reserved. Editorial Multi-Vendor Experience.</p>
          <div className="flex gap-6">
            <span>WCAG AA Compliant</span>
            <span>Zero Fake Data Guarantee</span>
            <span>Real-time SSE Powered</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
