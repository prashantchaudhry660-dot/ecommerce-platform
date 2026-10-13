import { create } from 'zustand';

export interface CartItem {
  productId: number;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  image?: string;
  sellerId?: number;
  sellerName?: string;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalCount: () => number;
  getSubtotal: () => number;
}

const getStoredCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem('passu_cart') || localStorage.getItem('cartly_cart');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveCart = (items: CartItem[]) => {
  localStorage.setItem('passu_cart', JSON.stringify(items));
};

export const useCartStore = create<CartState>((set, get) => ({
  items: getStoredCart(),
  isDrawerOpen: false,

  setDrawerOpen: (open) => set({ isDrawerOpen: open }),

  addItem: (item, quantity = 1) => {
    const current = get().items;
    const existingIndex = current.findIndex((i) => i.productId === item.productId);

    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...current];
      const newQty = Math.min(updated[existingIndex].quantity + quantity, item.stock);
      updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
    } else {
      updated = [...current, { ...item, quantity: Math.min(quantity, item.stock) }];
    }

    saveCart(updated);
    set({ items: updated, isDrawerOpen: true });
  },

  removeItem: (productId) => {
    const updated = get().items.filter((i) => i.productId !== productId);
    saveCart(updated);
    set({ items: updated });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const updated = get().items.map((i) => {
      if (i.productId === productId) {
        return { ...i, quantity: Math.min(quantity, i.stock) };
      }
      return i;
    });
    saveCart(updated);
    set({ items: updated });
  },

  clearCart: () => {
    localStorage.removeItem('passu_cart');
    localStorage.removeItem('cartly_cart');
    set({ items: [] });
  },

  getTotalCount: () => {
    return get().items.reduce((sum, i) => sum + i.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },
}));
