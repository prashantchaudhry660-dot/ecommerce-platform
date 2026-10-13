import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, ChevronLeft, ChevronRight, SlidersHorizontal, Sparkles } from 'lucide-react';
import { api } from '../../api/client';
import { ProductSummary, PageResponse } from '../../types';
import { ProductCard } from '../../components/ProductCard';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);

  const [categories, setCategories] = useState<string[]>([]);
  const [productsPage, setProductsPage] = useState<PageResponse<ProductSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync with URL query parameter
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat !== null) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Load distinct categories once
  useEffect(() => {
    api.public.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch products on filter changes
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    api.public
      .getProducts({
        category: selectedCategory || undefined,
        minPrice,
        maxPrice,
        inStock: inStockOnly || undefined,
        query: debouncedQuery || undefined,
        sortBy,
        page,
        size: 12,
      })
      .then((data) => {
        if (!isCancelled) {
          setProductsPage(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error(err);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedCategory, minPrice, maxPrice, inStockOnly, debouncedQuery, sortBy, page]);

  const handleCategoryClick = (cat: string) => {
    const next = selectedCategory === cat ? '' : cat;
    setSelectedCategory(next);
    setPage(0);
    if (next) {
      setSearchParams({ category: next });
    } else {
      setSearchParams({});
    }
  };

  const clearAllFilters = () => {
    setSelectedCategory('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setInStockOnly(false);
    setQuery('');
    setSortBy('newest');
    setPage(0);
    setSearchParams({});
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Directory</span>
          </div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-foreground">
            {selectedCategory ? `${selectedCategory} Collection` : 'All Studio Creations'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Showing {productsPage?.totalElements || 0} unique handcrafted items across all vetted vendors
          </p>
        </div>

        {/* Search input + Mobile Filter Trigger */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name, tags..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-100 dark:bg-surface-200 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden p-2.5 rounded-2xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground"
            aria-label="Open Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block space-y-6">
          <div className="p-5 rounded-3xl bg-card border border-border/80 space-y-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <Filter className="w-4 h-4 text-primary" />
                <span>Filters</span>
              </div>
              {(selectedCategory || minPrice || maxPrice || inStockOnly || query) && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Categories
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                <button
                  onClick={() => handleCategoryClick('')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    !selectedCategory
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-muted-foreground hover:bg-surface-100 dark:hover:bg-surface-200'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      selectedCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'text-muted-foreground hover:bg-surface-100 dark:hover:bg-surface-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Price Range (₹)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice !== undefined ? minPrice : ''}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : undefined;
                    setMinPrice(v);
                    setPage(0);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice !== undefined ? maxPrice : ''}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : undefined;
                    setMaxPrice(v);
                    setPage(0);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* In-Stock Only Toggle */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground cursor-pointer" htmlFor="in-stock-checkbox">
                In-Stock Only
              </label>
              <input
                id="in-stock-checkbox"
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setPage(0);
                }}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
            </div>
          </div>
        </aside>

        {/* Products Main Column */}
        <section className="md:col-span-3 space-y-6">
          {/* Sorting Bar */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border/80 text-xs">
            <span className="text-muted-foreground font-medium pl-2">
              Page {page + 1} of {productsPage?.totalPages || 1}
            </span>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-semibold">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(0);
                }}
                aria-label="Sort products by"
                className="bg-surface-100 dark:bg-surface-200 text-foreground px-3 py-1.5 rounded-xl border border-border focus:outline-none text-xs font-semibold cursor-pointer"
              >
                <option value="newest">Newest Releases</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Product Grid / Skeleton */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="rounded-3xl bg-surface-100 dark:bg-surface-200/50 aspect-[4/5] animate-pulse" />
              ))}
            </div>
          ) : productsPage && productsPage.content.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {productsPage.content.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          ) : (
            <div className="p-16 rounded-3xl border border-dashed border-border text-center bg-card/40 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-200 dark:bg-surface-100 flex items-center justify-center mx-auto text-muted-foreground">
                <Search className="w-6 h-6 opacity-50" />
              </div>
              <h3 className="text-base font-bold text-foreground">No matching products found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try widening your price filters, clearing categories, or searching with alternative keywords.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl mt-2"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {productsPage && productsPage.totalPages > 1 && (
            <div className="pt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded-2xl bg-surface-100 dark:bg-surface-200 text-xs font-bold text-foreground disabled:opacity-40 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-xs font-semibold text-muted-foreground px-2">
                Page {page + 1} of {productsPage.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= productsPage.totalPages - 1}
                className="px-4 py-2 rounded-2xl bg-surface-100 dark:bg-surface-200 text-xs font-bold text-foreground disabled:opacity-40 flex items-center gap-1.5"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
