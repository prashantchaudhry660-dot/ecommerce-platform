import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  ExternalLink,
  X,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../../api/client';
import { Product, PageResponse } from '../../types';
import { toast } from 'sonner';

export const SellerProductsPage: React.FC = () => {
  const [productsPage, setProductsPage] = useState<PageResponse<Product> | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [category, setCategory] = useState('Ceramics');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState<number>(10);
  const [imageUrls, setImageUrls] = useState<string>('');
  const [specsJson, setSpecsJson] = useState('{\n  "Material": "Porcelain Clay",\n  "Origin": "Kyoto Atelier"\n}');
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.seller.getProducts({ page, size: 10 });
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
  }, [page]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice(1299);
    setOriginalPrice(1599);
    setCategory('Ceramics');
    setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setStock(15);
    setImageUrls('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80\nhttps://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80');
    setSpecsJson('{\n  "Material": "Stoneware",\n  "Finish": "Matte Glaze",\n  "Handcrafted": "Yes"\n}');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || '');
    setPrice(p.price);
    setOriginalPrice(p.originalPrice);
    setCategory(p.category);
    setSku(p.sku);
    setStock(p.stock);
    setImageUrls(p.images ? p.images.join('\n') : '');
    setSpecsJson(p.specifications || '{}');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price <= 0 || !category) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    const parsedImages = imageUrls
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editingProduct) {
        await api.seller.updateProduct(editingProduct.id, {
          name,
          description,
          price,
          originalPrice,
          category,
          stock,
          imageUrls: parsedImages,
          specifications: specsJson,
        });
        toast.success(`Updated "${name}" successfully`);
      } else {
        await api.seller.createProduct({
          name,
          description,
          price,
          originalPrice,
          category,
          sku,
          stock,
          imageUrls: parsedImages,
          specifications: specsJson,
        });
        toast.success(`Product "${name}" listed successfully`);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, pName: string) => {
    if (!confirm(`Are you sure you want to delete "${pName}"?`)) return;
    try {
      await api.seller.deleteProduct(id);
      toast.success(`Deleted "${pName}"`);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not delete product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground">Product Listings</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your store's creations, stock levels, pricing, and specifications.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md shadow-primary/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </button>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-card border border-border/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-100 dark:bg-surface-200/60 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Item</th>
                <th className="py-3.5 px-4">SKU / Category</th>
                <th className="py-3.5 px-4">Price (₹)</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-foreground">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Loading store products...
                  </td>
                </tr>
              ) : productsPage && productsPage.content.length > 0 ? (
                productsPage.content.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-100/50 dark:hover:bg-surface-100/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.primaryImage || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover shrink-0 bg-surface-200"
                        />
                        <div>
                          <p className="font-bold text-foreground max-w-[200px] truncate">{p.name}</p>
                          <a
                            href={`/products/${p.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1"
                          >
                            <span>View Public Page</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-mono text-xs">{p.sku}</p>
                      <span className="text-[11px] text-muted-foreground capitalize">{p.category}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono">
                      ₹{p.price.toFixed(2)}
                      {p.originalPrice > p.price && (
                        <span className="block text-[10px] text-muted-foreground line-through font-normal">
                          ₹{p.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold ${
                          p.stock <= 5 ? 'text-amber-500' : 'text-foreground'
                        }`}
                      >
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500">
                        {p.moderationStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-200"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No products listed yet. Click "New Product" above to create your first listing!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)}>
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-card border border-border p-6 rounded-3xl shadow-2xl glass-panel space-y-5 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h3 className="text-base font-bold font-display text-foreground">
                {editingProduct ? 'Edit Product Listing' : 'Create New Product Listing'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-muted-foreground mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sculptural Ceramic Vessel"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Original Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground"
                  >
                    <option value="Ceramics">Ceramics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProduct}
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground font-mono disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Initial Stock *</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1">
                  Image URLs (one URL per line)
                </label>
                <textarea
                  rows={3}
                  value={imageUrls}
                  onChange={(e) => setImageUrls(e.target.value)}
                  placeholder="https://.../img1.jpg&#10;https://.../img2.jpg"
                  className="w-full px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe material, manufacturing atelier, and design inspiration..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground"
                />
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1">Specifications (JSON)</label>
                <textarea
                  rows={3}
                  value={specsJson}
                  onChange={(e) => setSpecsJson(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-200 text-foreground font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
