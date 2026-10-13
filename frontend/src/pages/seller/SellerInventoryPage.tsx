import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Boxes, AlertTriangle, Plus, Minus, Save, Check } from 'lucide-react';
import { api } from '../../api/client';
import { Product, InventoryAlert } from '../../types';
import { toast } from 'sonner';

export const SellerInventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [threshold, setThreshold] = useState<number>(5);
  const [lowStockAlerts, setLowStockAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockInputs, setStockInputs] = useState<Record<number, number>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, alertRes] = await Promise.all([
        api.seller.getProducts({ size: 50 }),
        api.seller.getLowStock(threshold),
      ]);
      setProducts(prodRes.content);
      setLowStockAlerts(alertRes);

      const map: Record<number, number> = {};
      prodRes.content.forEach((p) => {
        map[p.id] = p.stock;
      });
      setStockInputs(map);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [threshold]);

  const handleQuickUpdate = async (productId: number, newStock: number) => {
    if (newStock < 0) return;
    setSavingId(productId);
    try {
      await api.seller.updateStock(productId, newStock);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
      );
      setStockInputs((prev) => ({ ...prev, [productId]: newStock }));
      toast.success('Stock level updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setSavingId(null);
    }
  };

  const chartData = products.map((p) => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    stock: p.stock,
    isLow: p.stock <= threshold,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground">Inventory Overview & Alerts</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor real-time warehouse counts and adjust stock levels immediately.
          </p>
        </div>

        {/* Configurable Threshold */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground font-semibold">Low-Stock Threshold:</span>
          <select
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="bg-surface-100 dark:bg-surface-200 text-foreground px-3 py-1.5 rounded-xl border border-border text-xs font-bold"
          >
            <option value={3}>3 units</option>
            <option value={5}>5 units</option>
            <option value={10}>10 units</option>
            <option value={15}>15 units</option>
          </select>
        </div>
      </div>

      {/* Low Stock Callout Banners */}
      {lowStockAlerts.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="flex-1 font-semibold">
            {lowStockAlerts.length} product(s) have reached or dipped below the alert threshold of {threshold} units!
          </div>
        </div>
      )}

      {/* Recharts Bar Chart of Stock Levels */}
      {products.length > 0 && (
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <h3 className="text-sm font-bold font-display text-foreground">Stock Distribution Chart</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
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
                <Bar dataKey="stock" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isLow ? '#F59E0B' : '#7C5CFF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Inline Quick Stock Update Table */}
      <div className="rounded-3xl bg-card border border-border overflow-hidden shadow-sm">
        <div className="p-4 bg-surface-100 dark:bg-surface-200/50 border-b border-border flex items-center justify-between text-xs font-bold text-foreground">
          <span>Catalog Stock Table</span>
          <span className="text-muted-foreground font-normal">Instant live sync</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4 text-right">Inline Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {products.map((p) => {
                const isSaving = savingId === p.id;
                const currentVal = stockInputs[p.id] !== undefined ? stockInputs[p.id] : p.stock;
                const isLow = p.stock <= threshold;

                return (
                  <tr key={p.id} className="hover:bg-surface-100/40">
                    <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-3">
                      <img src={p.primaryImage || (p.images && p.images[0])} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      <span>{p.name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-muted-foreground">{p.sku}</td>
                    <td className="py-3.5 px-4">
                      {isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                          Adequate
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono text-sm">{p.stock}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleQuickUpdate(p.id, p.stock - 1)}
                          disabled={p.stock <= 0 || isSaving}
                          className="p-1 rounded-lg bg-surface-200 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <input
                          type="number"
                          value={currentVal}
                          onChange={(e) =>
                            setStockInputs({ ...stockInputs, [p.id]: Number(e.target.value) })
                          }
                          className="w-16 px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-200 border border-border text-center font-mono font-bold text-xs"
                        />

                        <button
                          onClick={() => handleQuickUpdate(p.id, p.stock + 1)}
                          disabled={isSaving}
                          className="p-1 rounded-lg bg-surface-200 text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleQuickUpdate(p.id, currentVal)}
                          disabled={isSaving || currentVal === p.stock}
                          className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-[11px] disabled:opacity-40"
                        >
                          {isSaving ? '...' : 'Save'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
