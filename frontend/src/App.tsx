import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Layouts
import { BuyerLayout } from './layouts/BuyerLayout';
import { SellerLayout } from './layouts/SellerLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { RoleGuard } from './layouts/RoleGuard';

// Pages
import { HomePage } from './pages/buyer/HomePage';
import { CatalogPage } from './pages/buyer/CatalogPage';
import { ProductDetailPage } from './pages/buyer/ProductDetailPage';
import { CheckoutPage } from './pages/buyer/CheckoutPage';
import { OrderSuccessPage } from './pages/buyer/OrderSuccessPage';
import { OrderTrackPage } from './pages/buyer/OrderTrackPage';
import { BuyerAccountPage } from './pages/buyer/BuyerAccountPage';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

import { SellerDashboardPage } from './pages/seller/SellerDashboardPage';
import { SellerProductsPage } from './pages/seller/SellerProductsPage';
import { SellerInventoryPage } from './pages/seller/SellerInventoryPage';
import { SellerOrdersPage } from './pages/seller/SellerOrdersPage';
import { SellerAnalyticsPage } from './pages/seller/SellerAnalyticsPage';

import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminActivityPage } from './pages/admin/AdminActivityPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public & Buyer Experience Routes */}
          <Route element={<BuyerLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />

            {/* Role Guarded Buyer Features */}
            <Route
              path="/checkout"
              element={
                <RoleGuard allowedRoles={['BUYER']}>
                  <CheckoutPage />
                </RoleGuard>
              }
            />
            <Route
              path="/order-success/:id"
              element={
                <RoleGuard allowedRoles={['BUYER']}>
                  <OrderSuccessPage />
                </RoleGuard>
              }
            />
            <Route
              path="/orders/:id/track"
              element={
                <RoleGuard allowedRoles={['BUYER']}>
                  <OrderTrackPage />
                </RoleGuard>
              }
            />
            <Route
              path="/account"
              element={
                <RoleGuard allowedRoles={['BUYER']}>
                  <BuyerAccountPage />
                </RoleGuard>
              }
            />
          </Route>

          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Dedicated Seller Dashboard Routes */}
          <Route
            path="/seller"
            element={
              <RoleGuard allowedRoles={['SELLER']}>
                <SellerLayout />
              </RoleGuard>
            }
          >
            <Route index element={<SellerDashboardPage />} />
            <Route path="products" element={<SellerProductsPage />} />
            <Route path="inventory" element={<SellerInventoryPage />} />
            <Route path="orders" element={<SellerOrdersPage />} />
            <Route path="analytics" element={<SellerAnalyticsPage />} />
          </Route>

          {/* Dedicated Admin Governance Dashboard Routes */}
          <Route
            path="/admin"
            element={
              <RoleGuard allowedRoles={['ADMIN']}>
                <AdminLayout />
              </RoleGuard>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="activity" element={<AdminActivityPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Toast System */}
        <Toaster richColors position="top-right" closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  );
};
export default App;
