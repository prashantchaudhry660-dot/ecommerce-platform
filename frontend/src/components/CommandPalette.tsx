import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, Shield, Store, Sun, Moon, Package } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/client';
import { ProductSummary } from '../types';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName))) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open || !search.trim()) {
      setProducts([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.public.getProducts({ query: search, size: 5 });
        setProducts(res.content);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [open, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => onOpenChange(false)}>
      <div
        className="w-full max-w-2xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden glass-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Global Command Menu" shouldFilter={false} className="w-full">
          <div className="flex items-center px-4 border-b border-border/60">
            <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search products, jump to dashboard, toggle theme..."
              className="w-full py-4 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-base"
              autoFocus
            />
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs text-muted-foreground bg-surface-200 dark:bg-surface-100 rounded border border-border">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-96 overflow-y-auto p-2 space-y-1">
            {loading && <div className="p-4 text-sm text-center text-muted-foreground">Searching catalog...</div>}

            {products.length > 0 && (
              <Command.Group heading="Products" className="text-xs font-semibold text-muted-foreground px-2 py-1">
                {products.map((p) => (
                  <Command.Item
                    key={p.id}
                    onSelect={() => {
                      navigate(`/products/${p.slug}`);
                      onOpenChange(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-100 cursor-pointer text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {p.primaryImage ? (
                        <img src={p.primaryImage} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium text-foreground">{p.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{p.category}</div>
                      </div>
                    </div>
                    <span className="font-semibold text-primary">₹{p.price.toFixed(2)}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Navigation" className="text-xs font-semibold text-muted-foreground px-2 py-1">
              <Command.Item
                onSelect={() => {
                  navigate('/catalog');
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-100 cursor-pointer text-sm"
              >
                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                <span>Explore Catalog</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  navigate('/account');
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-100 cursor-pointer text-sm"
              >
                <Heart className="w-4 h-4 text-muted-foreground" />
                <span>My Wishlist & Orders</span>
              </Command.Item>

              {user?.role === 'SELLER' && (
                <Command.Item
                  onSelect={() => {
                    navigate('/seller');
                    onOpenChange(false);
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-100 cursor-pointer text-sm text-primary font-medium"
                >
                  <Store className="w-4 h-4 text-primary" />
                  <span>Seller Dashboard</span>
                </Command.Item>
              )}

              {user?.role === 'ADMIN' && (
                <Command.Item
                  onSelect={() => {
                    navigate('/admin');
                    onOpenChange(false);
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-100 cursor-pointer text-sm text-accent-foreground font-medium"
                >
                  <Shield className="w-4 h-4 text-accent" />
                  <span>Admin Governance</span>
                </Command.Item>
              )}
            </Command.Group>

            <Command.Group heading="Preferences" className="text-xs font-semibold text-muted-foreground px-2 py-1">
              <Command.Item
                onSelect={() => {
                  toggleTheme();
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-100 cursor-pointer text-sm"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                <span>Toggle Theme ({theme === 'dark' ? 'Light' : 'Dark'})</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
};
