import axios from 'axios';
import {
  AuthResponse,
  User,
  ProductSummary,
  Product,
  Order,
  OrderItem,
  Address,
  PaymentMethod,
  WishlistItem,
  RecentlyViewedItem,
  SellerAnalytics,
  InventoryAlert,
  AdminMetrics,
  ActivityLog,
  PageResponse,
  OrderStatus,
  ProductModerationStatus,
} from '../types';

// Resolve API base address dynamically from import.meta.env.VITE_API_URL
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) {
    return '/api';
  }
  const trimmed = envUrl.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) {
    return trimmed;
  }
  return `${trimmed}/api`;
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach access token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('passu_access_token') || localStorage.getItem('cartly_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('passu_refresh_token') || localStorage.getItem('cartly_refresh_token');
      if (!refreshToken) {
        localStorage.removeItem('passu_access_token');
        localStorage.removeItem('passu_refresh_token');
        localStorage.removeItem('passu_user');
        localStorage.removeItem('cartly_access_token');
        localStorage.removeItem('cartly_refresh_token');
        localStorage.removeItem('cartly_user');
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<AuthResponse>(`${getApiBaseUrl()}/auth/refresh`, {
          refreshToken,
        });
        localStorage.setItem('passu_access_token', data.accessToken);
        localStorage.setItem('passu_refresh_token', data.refreshToken);
        localStorage.setItem('passu_user', JSON.stringify(data.user));
        localStorage.removeItem('cartly_access_token');
        localStorage.removeItem('cartly_refresh_token');
        localStorage.removeItem('cartly_user');

        apiClient.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('passu_access_token');
        localStorage.removeItem('passu_refresh_token');
        localStorage.removeItem('passu_user');
        localStorage.removeItem('cartly_access_token');
        localStorage.removeItem('cartly_refresh_token');
        localStorage.removeItem('cartly_user');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Typed API Functions
export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post<AuthResponse>('/auth/login', credentials).then((res) => res.data),
    register: (payload: { email: string; password: string; fullName: string; role: 'SELLER' | 'BUYER' }) =>
      apiClient.post<AuthResponse>('/auth/register', payload).then((res) => res.data),
    getMe: () => apiClient.get<User>('/auth/me').then((res) => res.data),
  },
  public: {
    getProducts: (params?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      query?: string;
      sortBy?: string;
      page?: number;
      size?: number;
    }) => apiClient.get<PageResponse<ProductSummary>>('/public/products', { params }).then((res) => res.data),
    getProduct: (identifier: string | number) =>
      apiClient.get<Product>(`/public/products/${identifier}`).then((res) => res.data),
    getCategories: () => apiClient.get<string[]>('/public/categories').then((res) => res.data),
  },
  buyer: {
    checkout: (payload: {
      items: Array<{ productId: number; quantity: number }>;
      addressId?: number;
      newAddress?: Partial<Address>;
      paymentMethod: string;
    }) => apiClient.post<Order>('/buyer/checkout', payload).then((res) => res.data),
    getOrders: (params?: { page?: number; size?: number }) =>
      apiClient.get<PageResponse<Order>>('/buyer/orders', { params }).then((res) => res.data),
    getOrder: (id: number) => apiClient.get<Order>(`/buyer/orders/${id}`).then((res) => res.data),
    getAddresses: () => apiClient.get<Address[]>('/buyer/addresses').then((res) => res.data),
    createAddress: (payload: Omit<Address, 'id'>) =>
      apiClient.post<Address>('/buyer/addresses', payload).then((res) => res.data),
    deleteAddress: (id: number) => apiClient.delete(`/buyer/addresses/${id}`),
    getPaymentMethods: () => apiClient.get<PaymentMethod[]>('/buyer/payment-methods').then((res) => res.data),
    createPaymentMethod: (payload: Omit<PaymentMethod, 'id'>) =>
      apiClient.post<PaymentMethod>('/buyer/payment-methods', payload).then((res) => res.data),
    getWishlist: () => apiClient.get<WishlistItem[]>('/buyer/wishlist').then((res) => res.data),
    addToWishlist: (productId: number) => apiClient.post(`/buyer/wishlist/${productId}`),
    removeFromWishlist: (productId: number) => apiClient.delete(`/buyer/wishlist/${productId}`),
    getRecentlyViewed: (limit?: number) =>
      apiClient.get<RecentlyViewedItem[]>('/buyer/recently-viewed', { params: { limit } }).then((res) => res.data),
  },
  seller: {
    getProducts: (params?: { page?: number; size?: number }) =>
      apiClient.get<PageResponse<Product>>('/seller/products', { params }).then((res) => res.data),
    createProduct: (payload: {
      name: string;
      description?: string;
      price: number;
      originalPrice: number;
      category: string;
      sku: string;
      stock: number;
      imageUrls?: string[];
      specifications?: string;
    }) => apiClient.post<Product>('/seller/products', payload).then((res) => res.data),
    updateProduct: (
      id: number,
      payload: {
        name: string;
        description?: string;
        price: number;
        originalPrice: number;
        category: string;
        stock: number;
        imageUrls?: string[];
        specifications?: string;
      }
    ) => apiClient.put<Product>(`/seller/products/${id}`, payload).then((res) => res.data),
    deleteProduct: (id: number) => apiClient.delete(`/seller/products/${id}`),
    updateStock: (id: number, stock: number) =>
      apiClient.patch<Product>(`/seller/products/${id}/stock`, { stock }).then((res) => res.data),
    getLowStock: (threshold?: number) =>
      apiClient.get<InventoryAlert[]>('/seller/inventory/low-stock', { params: { threshold } }).then((res) => res.data),
    getOrders: (params?: { page?: number; size?: number }) =>
      apiClient.get<PageResponse<OrderItem>>('/seller/orders', { params }).then((res) => res.data),
    getOrdersByStatus: (status: OrderStatus) =>
      apiClient.get<OrderItem[]>(`/seller/orders/status/${status}`).then((res) => res.data),
    updateOrderItemStatus: (itemId: number, status: OrderStatus, notes?: string) =>
      apiClient.patch<OrderItem>(`/seller/orders/items/${itemId}/status`, { status, notes }).then((res) => res.data),
    getAnalytics: (days?: number) =>
      apiClient.get<SellerAnalytics>('/seller/analytics', { params: { days } }).then((res) => res.data),
  },
  admin: {
    getUsers: (params?: { role?: string; search?: string; page?: number; size?: number }) =>
      apiClient.get<PageResponse<User>>('/admin/users', { params }).then((res) => res.data),
    updateUserStatus: (id: number, status: 'ACTIVE' | 'SUSPENDED') =>
      apiClient.patch<User>(`/admin/users/${id}/status`, { status }).then((res) => res.data),
    updateUser: (id: number, payload: { fullName?: string; email?: string; role?: string }) =>
      apiClient.put<User>(`/admin/users/${id}`, payload).then((res) => res.data),
    deleteUser: (id: number) => apiClient.delete(`/admin/users/${id}`),
    getProducts: (params?: { status?: ProductModerationStatus; search?: string; page?: number; size?: number }) =>
      apiClient.get<PageResponse<Product>>('/admin/products', { params }).then((res) => res.data),
    moderateProduct: (id: number, status: ProductModerationStatus, reason?: string) =>
      apiClient.patch<Product>(`/admin/products/${id}/moderate`, { status, reason }).then((res) => res.data),
    getOrders: (params?: { status?: OrderStatus; search?: string; page?: number; size?: number }) =>
      apiClient.get<PageResponse<Order>>('/admin/orders', { params }).then((res) => res.data),
    updateOrderStatus: (id: number, status: OrderStatus, notes?: string) =>
      apiClient.patch<Order>(`/admin/orders/${id}/status`, { status, notes }).then((res) => res.data),
    getMetrics: () => apiClient.get<AdminMetrics>('/admin/metrics').then((res) => res.data),
    getActivity: (params?: { page?: number; size?: number }) =>
      apiClient.get<PageResponse<ActivityLog>>('/admin/activity', { params }).then((res) => res.data),
  },
};
