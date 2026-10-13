import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, Lock, Mail, ShieldAlert } from 'lucide-react';
import { api } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.auth.login({ email, password });
      setAuth(res);
      toast.success(`Welcome back, ${res.user.fullName}!`);

      if (res.user.role === 'ADMIN') {
        navigate('/admin');
      } else if (res.user.role === 'SELLER') {
        navigate('/seller');
      } else {
        navigate(from === '/login' ? '/' : from);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid email or password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-card border border-border/80 p-8 sm:p-10 rounded-3xl shadow-xl glass-panel animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/25">
              <Sparkles className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-2xl font-extrabold font-display tracking-tight text-foreground">
              Passu<span className="text-primary">.</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold font-display text-foreground pt-2">Welcome Back</h2>
          <p className="text-xs text-muted-foreground">Sign in to your account across all three dashboards</p>
        </div>

        {/* Demo Quick Pill Helpers */}
        <div className="p-3 rounded-2xl bg-surface-100 dark:bg-surface-200/50 border border-border/60 text-xs">
          <span className="text-muted-foreground block mb-1.5 font-semibold">Quick Login Fill:</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fillQuickDemo('admin@passu.com', 'Admin@Passu2025!')}
              className="px-2.5 py-1 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent-foreground font-bold text-[11px] transition-colors"
            >
              Admin Seed
            </button>
            <span className="text-muted-foreground self-center">|</span>
            <span className="text-[11px] text-muted-foreground self-center">
              Or register a new Seller/Buyer account below
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface-100 dark:bg-surface-200 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface-100 dark:bg-surface-200 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Passu</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-2">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-primary font-bold hover:underline">
            Register as Buyer or Seller
          </Link>
        </div>
      </div>
    </div>
  );
};
