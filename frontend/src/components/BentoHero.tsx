import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Store, Layers, ShieldCheck, Zap } from 'lucide-react';

export const BentoHero: React.FC = () => {
  return (
    <div className="relative pt-6 pb-12">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-primary/20 via-accent/15 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

      {/* Hero Header Typography */}
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-100 dark:bg-surface-200 border border-border/80 text-xs font-semibold text-foreground">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>The 2025 Multi-Vendor Editorial Edition</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-foreground leading-[1.08]">
          Crafted by Creators. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-accent">
            Curated for You.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Passu connects boutique makers and design studios in one seamless checkout. Real stock, independent sellers, zero compromise.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/catalog"
            className="px-6 py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/25 transition-all hover:scale-105"
          >
            <span>Explore Collection</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="px-6 py-3.5 bg-surface-100 dark:bg-surface-200 text-foreground font-semibold rounded-2xl border border-border/80 hover:border-foreground/30 transition-all flex items-center gap-2"
          >
            <Store className="w-4 h-4 text-primary" />
            <span>Open a Studio Store</span>
          </Link>
        </div>
      </div>

      {/* Bento Grid Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 max-w-7xl mx-auto">
        {/* Bento Item 1: Large Editorial Visual */}
        <div className="md:col-span-8 rounded-3xl overflow-hidden relative min-h-[360px] bg-card border border-border/80 flex flex-col justify-end p-8 group">
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80"
            alt="Minimalist Living Space"
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-[0.75] dark:brightness-[0.6]"
          />
          <div className="relative z-10 max-w-md space-y-2 text-white">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-extrabold uppercase tracking-wider">
              Studio Spotlight
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display leading-snug">
              Minimalist Scandinavian Living & Studio Accents
            </h3>
            <p className="text-xs sm:text-sm text-slate-200">
              Handcrafted in limited runs by independent furniture architects.
            </p>
          </div>
        </div>

        {/* Bento Item 2: Multi-Vendor Split Card */}
        <div className="md:col-span-4 rounded-3xl p-6 bg-card border border-border/80 flex flex-col justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-foreground">
              Multi-Vendor Splitting
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Order from five different creators simultaneously. Our transactional engine splits line items and dispatches directly from respective seller studios.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
            <span>Independent Fulfilment</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        {/* Bento Item 3: Concurrency Stock Safeguard */}
        <div className="md:col-span-4 rounded-3xl p-6 bg-card border border-border/80 flex flex-col justify-between shadow-sm group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-foreground">
              Atomic Stock Engine
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pessimistic locking and conditional SQL updates ensure that items in high demand can never oversell. Real-time availability reflects live catalog counts.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>Transactional Isolation</span>
            <span className="font-mono text-[11px] text-foreground font-bold">409 Conflict Safety</span>
          </div>
        </div>

        {/* Bento Item 4: Realtime Seller Stream Card */}
        <div className="md:col-span-8 rounded-3xl overflow-hidden relative min-h-[220px] bg-gradient-to-r from-surface-100 to-surface-200 dark:from-surface-100/90 dark:to-surface-200/90 border border-border/80 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-md">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Realtime SSE Feed
            </div>
            <h3 className="text-xl font-bold font-display text-foreground">
              Live Notifications & Kanban Processing
            </h3>
            <p className="text-xs text-muted-foreground">
              Sellers receive instant Server-Sent Events when an order is placed, while buyers track package milestones via dynamic timeline histories.
            </p>
          </div>

          <Link
            to="/catalog"
            className="px-5 py-3 rounded-2xl bg-foreground text-background text-xs font-bold shrink-0 hover:bg-primary hover:text-white transition-all shadow-md"
          >
            Shop Verified Creations
          </Link>
        </div>
      </div>
    </div>
  );
};
