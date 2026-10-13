import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Sun,
  Moon,
  User as UserIcon,
  Store,
  Shield,
  LogOut,
  Heart,
  Menu,
  X,
  Sparkles,
  Home,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useThemeStore } from '../store/themeStore';
import { CommandPalette } from './CommandPalette';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { setDrawerOpen, getTotalCount } = useCartStore();
  const { theme, toggleTheme } = useThemeStore();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = getTotalCount();

  const handleSignOut = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-4 z-40 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-all">
        <nav className="glass-panel rounded-3xl px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg shadow-black/5 dark:shadow-black/20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground shadow-md shadow-primary/30 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold font-display tracking-tight text-foreground">
                  Passu<span className="text-primary">.</span>
                </span>
                <span className="text-[9px] font-semibold tracking-widest uppercase text-muted-foreground -mt-1">
                  Multi-Vendor Studio
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link
                to="/catalog"
                className={`hover:text-foreground transition-colors ${
                  location.pathname === '/catalog' ? 'text-primary font-semibold' : ''
                }`}
              >
                Catalog
              </Link>
              <Link
                to="/catalog?category=Ceramics"
                className="hover:text-foreground transition-colors"
              >
                Ceramics
              </Link>
              <Link
                to="/catalog?category=Furniture"
                className="hover:text-foreground transition-colors"
              >
                Furniture
              </Link>
              <Link
                to="/catalog?category=Lighting"
                className="hover:text-foreground transition-colors"
              >
                Lighting
              </Link>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Cmd+K Search trigger */}
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground bg-surface-100 dark:bg-surface-200/60 hover:bg-surface-200 dark:hover:bg-surface-100 border border-border/80 rounded-2xl transition-all"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="hidden sm:inline">Search studio items...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-surface-300 dark:bg-surface-100 rounded border border-border">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="p-2.5 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-surface-100 dark:hover:bg-surface-200 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            {/* Cart Trigger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative p-2.5 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-surface-100 dark:hover:bg-surface-200 transition-colors"
              aria-label="Open Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md animate-scale-in">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Dropdown / Auth CTA */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl bg-surface-100 dark:bg-surface-200 border border-border text-xs font-semibold text-foreground hover:border-primary/50 transition-colors"
                >
                  <div className="w-6 h-6 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline max-w-[100px] truncate">{user.fullName}</span>
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-2xl p-2 glass-panel z-50 animate-scale-in"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-border/60">
                      <p className="text-xs font-bold text-foreground truncate">{user.fullName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-primary/10 text-primary">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1 text-xs">
                      {user.role === 'BUYER' && (
                        <>
                          <Link
                            to="/account"
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-100"
                          >
                            <UserIcon className="w-4 h-4 text-muted-foreground" />
                            Account & Orders
                          </Link>
                          <Link
                            to="/account"
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-100"
                          >
                            <Heart className="w-4 h-4 text-rose-500" />
                            Wishlist
                          </Link>
                        </>
                      )}

                      {user.role === 'SELLER' && (
                        <Link
                          to="/seller"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-primary font-semibold hover:bg-primary/10"
                        >
                          <Store className="w-4 h-4 text-primary" />
                          Seller Workspace
                        </Link>
                      )}

                      {user.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-accent-foreground font-semibold bg-accent/15 hover:bg-accent/25"
                        >
                          <Shield className="w-4 h-4 text-accent" />
                          Admin Governance
                        </Link>
                      )}

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-foreground hover:bg-surface-100 rounded-2xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex px-4 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary-hover rounded-2xl shadow-md shadow-primary/20 transition-all hover:scale-105"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-2xl text-muted-foreground hover:text-foreground"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 p-4 glass-panel rounded-3xl border border-border shadow-xl space-y-3">
            <Link
              to="/catalog"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-foreground py-2"
            >
              Explore Catalog
            </Link>
            <Link
              to="/catalog?category=Ceramics"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-muted-foreground py-1"
            >
              Ceramics
            </Link>
            <Link
              to="/catalog?category=Furniture"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-muted-foreground py-1"
            >
              Furniture
            </Link>
            <Link
              to="/catalog?category=Lighting"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-muted-foreground py-1"
            >
              Lighting
            </Link>
          </div>
        )}
      </header>

      {/* Global Cmd+K Command Palette */}
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      {/* Mobile Fixed Bottom Tab Bar for Buyers */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-6 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-primary' : ''}`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>
        <Link
          to="/catalog"
          className={`flex flex-col items-center gap-1 ${location.pathname === '/catalog' ? 'text-primary' : ''}`}
        >
          <Layers className="w-5 h-5" />
          <span>Catalog</span>
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center gap-1 relative text-foreground"
        >
          <ShoppingBag className="w-5 h-5 text-primary" />
          <span>Cart</span>
          {cartCount > 0 && (
            <span className="absolute -top-1.5 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
        <Link
          to={isAuthenticated ? '/account' : '/login'}
          className={`flex flex-col items-center gap-1 ${location.pathname.startsWith('/account') ? 'text-primary' : ''}`}
        >
          <UserIcon className="w-5 h-5" />
          <span>{isAuthenticated ? 'Account' : 'Sign In'}</span>
        </Link>
      </div>
    </>
  );
};
