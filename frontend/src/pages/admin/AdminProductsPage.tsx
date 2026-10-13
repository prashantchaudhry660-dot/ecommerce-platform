import React, { useEffect, useState } from 'react';
import {
  Package,
  Search,
  ShieldCheck,
  Flag,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../api/client';
import { Product, ProductModerationStatus, PageResponse } from '../../types';
import { toast } from 'sonner';

export const AdminProductsPage: React.FC = () => {
  const [productsPage, setProductsPage] = useState<PageResponse<Product> | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProductModerationStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Moderation Modal
  const [moderatingProduct, setModeratingProduct] = useState<Product | null>(null);
  const [modStatus, setModStatus] = useState<ProductModerationStatus>('APPROVED');
  const [modReason, setModReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getProducts({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        size: 15,
      });
      setProductsPage(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [statusFilter, search, page]);

  const openModerateModal = (p: Product) => {
    setModeratingProduct(p);
    setModStatus(p.moderationStatus);
    setModReason(p.moderationReason || '');
  };

  const handleSaveModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderatingProduct) return;
    setSubmitting(true);
    try {
      await api.admin.moderateProduct(moderatingProduct.id, modStatus, modReason);
      toast.success(`Moderated "${moderatingProduct.name}" to ${modStatus}`, {
        description: modReason ? `Reason: ${modReason}` : 'Status updated.',
      });
      setModeratingProduct(null);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to moderate product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground">Catalog Moderation & Auditing</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit store listings, flag questionable content, or remove non-compliant items.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(0);
            }}
            className="bg-surface-100 dark:bg-surface-200 text-foreground px-3 py-2 rounded-2xl border border-border text-xs font-bold"
          >
            <option value="">All Statuses</option>
            <option value="APPROVED">APPROVED</option>
            <option value="FLAGGED">FLAGGED</option>
            <option value="REMOVED">REMOVED</option>
          </select>

          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search product or SKU..."
              className="pl-9 pr-3 py-2 rounded-2xl bg-surface-100 dark:bg-surface-200 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-card border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-100 dark:bg-surface-200/60 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Seller Store</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Moderation Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-foreground">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Loading catalog items...
                  </td>
                </tr>
              ) : productsPage && productsPage.content.length > 0 ? (
                productsPage.content.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-100/40">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.primaryImage || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover shrink-0 bg-surface-200"
                        />
                        <div>
                          <p className="font-bold text-foreground max-w-[200px] truncate">{p.name}</p>
                          <span className="font-mono text-[10px] text-muted-foreground">SKU: {p.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-primary">{p.sellerName}</td>
                    <td className="py-3.5 px-4 text-muted-foreground capitalize">{p.category}</td>
                    <td className="py-3.5 px-4 font-bold font-mono">₹{p.price.toFixed(2)}</td>
                    <td className="py-3.5 px-4">{p.stock} units</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          p.moderationStatus === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : p.moderationStatus === 'FLAGGED'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}
                      >
                        {p.moderationStatus}
                      </span>
                      {p.moderationReason && (
                        <span className="block text-[10px] text-muted-foreground truncate max-w-[150px]">
                          {p.moderationReason}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openModerateModal(p)}
                        className="px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-200 text-foreground font-bold hover:bg-surface-200 border border-border"
                      >
                        Moderate
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No products matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Moderation Modal */}
      {moderatingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setModeratingProduct(null)}>
          <div
            className="w-full max-w-md bg-card border border-border p-6 rounded-3xl shadow-2xl glass-panel space-y-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h3 className="text-base font-bold font-display text-foreground">
                Moderate "{moderatingProduct.name}"
              </h3>
              <button onClick={() => setModeratingProduct(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModeration} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-muted-foreground mb-1">Status Action</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModStatus('APPROVED')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      modStatus === 'APPROVED'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-sm'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    APPROVED
                  </button>
                  <button
                    type="button"
                    onClick={() => setModStatus('FLAGGED')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      modStatus === 'FLAGGED'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500 shadow-sm'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    FLAGGED
                  </button>
                  <button
                    type="button"
                    onClick={() => setModStatus('REMOVED')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      modStatus === 'REMOVED'
                        ? 'border-rose-500 bg-rose-500/10 text-rose-500 shadow-sm'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    REMOVED
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1">Moderation Reason</label>
                <textarea
                  rows={3}
                  value={modReason}
                  onChange={(e) => setModReason(e.target.value)}
                  placeholder="e.g. Complies with artisan guidelines, or Flagged for further imagery inspection..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setModeratingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 text-foreground font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold disabled:opacity-50"
                >
                  {submitting ? 'Applying...' : 'Apply Moderation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
