import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BentoHero } from '../../components/BentoHero';
import { CategoryBar } from '../../components/CategoryBar';
import { ProductCard } from '../../components/ProductCard';
import { api } from '../../api/client';
import { ProductSummary } from '../../types';
import { Sparkles, ArrowRight, Store, PackagePlus } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.public.getProducts({ size: 8 }),
          api.public.getCategories(),
        ]);
        setProducts(prodRes.content);
        setCategories(catRes);
      } catch (err) {
        console.error('Failed to load catalog data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-16">
      {/* Editorial Bento Hero */}
      <BentoHero />

      {/* Snap-scroll Category Bar */}
      <div className="border-y border-border/60">
        <CategoryBar categories={categories} />
      </div>

      {/* Curated Products Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Curations</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-foreground">
              Recent Studio Releases
            </h2>
          </div>

          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 text-xs font-bold text-foreground hover:text-primary transition-colors"
          >
            <span>View Complete Catalog ({products.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Grid or Empty State */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-3xl bg-surface-100 animate-pulse aspect-[4/5]" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-3xl border border-dashed border-border text-center bg-card/50 space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-surface-200 dark:bg-surface-100 flex items-center justify-center mx-auto text-muted-foreground">
              <PackagePlus className="w-8 h-8 opacity-50" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Studio Catalog Ready</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No products have been listed yet. Register as a Seller studio to list your architectural pieces, or explore the live platform demo.
            </p>
            <div className="pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-2xl shadow-md hover:bg-primary-hover transition-all"
              >
                <Store className="w-4 h-4" />
                <span>List the First Product</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Editorial Studio Stories Banner */}
      <section className="rounded-4xl bg-gradient-to-br from-surface-100 via-card to-surface-200 dark:from-surface-100/60 dark:via-card/60 dark:to-surface-200/40 border border-border p-8 sm:p-12 relative overflow-hidden">
        <div className="max-w-xl space-y-4">
          <span className="px-3 py-1 bg-accent/20 text-accent-foreground text-[11px] font-extrabold uppercase tracking-wider rounded-full">
            Artisan Manifesto
          </span>
          <h3 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-foreground leading-tight">
            Direct from Independent Design Workshops
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Every creation on Passu comes directly from verified makers. No middlemen markup, no dropshipping, and no fake review manipulation.
          </p>
          <div className="pt-4 flex flex-wrap gap-4">
            <Link
              to="/catalog"
              className="px-5 py-3 rounded-2xl bg-foreground text-background text-xs font-bold hover:bg-primary hover:text-white transition-all shadow-md"
            >
              Explore All Collections
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
