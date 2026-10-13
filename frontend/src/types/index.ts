export type UserRole = 'ADMIN' | 'SELLER' | 'BUYER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export type ProductModerationStatus = 'APPROVED' | 'FLAGGED' | 'REMOVED';

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ProductSummary {
  id: number;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  category: string;
  stock: number;
  primaryImage?: string;
  secondaryImage?: string;
  moderationStatus: ProductModerationStatus;
}

export interface Product {
  id: number;
  sellerId: number;
  sellerName: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number;
  category: string;
  sku: string;
  stock: number;
  moderationStatus: ProductModerationStatus;
  moderationReason?: string;
  specifications?: string;
  images: string[];
  primaryImage?: string;
  secondaryImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: number;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: number;
  provider: string;
  cardType: string;
  maskedNumber: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface OrderItem {
  id: number;
  orderId: number;
  orderNumber: string;
  productId: number;
  sellerId: number;
  sellerName: string;
  productName: string;
  productImage?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  itemStatus: OrderStatus;
  createdAt: string;
}

export interface OrderStatusHistory {
  id: number;
  orderId: number;
  orderItemId?: number;
  status: string;
  notes?: string;
  changedByName: string;
  createdAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  buyerId: number;
  buyerName: string;
  buyerEmail: string;
  totalAmount: number;
  shippingAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  overallStatus: OrderStatus;
  shippingAddress?: Address;
  items: OrderItem[];
  statusHistories: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  productImage?: string;
  currentPrice: number;
  priceAtAdd: number;
  hasPriceDropped: boolean;
  priceDropAmount: number;
  stock: number;
  category: string;
}

export interface RecentlyViewedItem {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  productImage?: string;
  price: number;
  category: string;
  viewedAt: string;
}

export interface DailySalesPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productName: string;
  unitsSold: number;
  totalRevenue: number;
  productImage?: string;
}

export interface StatusCount {
  status: OrderStatus;
  count: number;
}

export interface SellerAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  salesChart: DailySalesPoint[];
  topProducts: TopProduct[];
  ordersByStatus: StatusCount[];
}

export interface InventoryAlert {
  productId: number;
  productName: string;
  sku: string;
  stock: number;
  category: string;
  image?: string;
}

export interface SparklinePoint {
  date: string;
  value: number;
  count: number;
}

export interface AdminMetrics {
  gmv: number;
  ordersToday: number;
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  gmvTrend: SparklinePoint[];
  platformOrdersByStatus: StatusCount[];
}

export interface ActivityLog {
  id: number;
  userId?: number;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
