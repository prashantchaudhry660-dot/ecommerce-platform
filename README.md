# Passu — Next-Gen Multi-Vendor E-Commerce Platform

> **Modern, Editorial 2025-Era Multi-Vendor Architecture**  
> Three dedicated dashboards (Admin, Seller, Buyer) powered by Spring Boot 3.3, MySQL 8, and React 18 + Vite + Tailwind CSS.

---

## 🌟 Highlights & Architecture

- **Independent Triple-Role Dashboards**:
  - **Admin (`/admin`)**: Real-time SSE activity feed, KPI summary cards with trend sparklines, user role management (activate/suspend), product moderation (approve/flag/remove with audit reasons), and global order management.
  - **Seller (`/seller`)**: Product listing manager with image galleries and specification key-values, inventory monitoring with stock level charts & low-stock alerts, inline restock updates, Kanban order fulfillment board (drag-and-drop / stage actions), and SQL aggregate sales analytics.
  - **Buyer (`/` and `/account`)**: Editorial bento-grid showcase, server-side debounced catalog with category/price/rating filters, image gallery with zoom, optimistic cart drawer grouped by vendor, multi-step checkout with simulated payment, animated confetti order confirmation, vertical real-time order history tracking timeline, wishlist with price-drop badges, and saved address/payment management.
- **Multi-Vendor Order Splitting**:
  - A single order split across multiple vendor order items (`OrderItem`), each possessing independent fulfillment statuses (`PLACED`, `CONFIRMED`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
  - Overall order status is dynamically derived from item statuses.
- **Concurrency & Stock Safety**:
  - Pessimistic / atomic conditional stock deduction:  
    `UPDATE products SET stock = stock - :qty WHERE id = :id AND stock >= :qty`
  - Transactional boundary prevents race conditions, overselling, or negative inventory; returns clear `HTTP 409 Conflict` on stock exhaustion.
  - Snapshot unit pricing at checkout time (`unit_price`).
- **Strict Seed Rules**:
  - Zero hardcoded fake products, orders, or chart mocks.
  - The **sole** seed record is the platform administrator initialized dynamically at application boot via a Spring `ApplicationRunner` (`AdminStartupRunner`) using runtime `BCryptPasswordEncoder`.
  - All sellers and buyers onboard through real registration and authentication flows.
- **Realtime SSE Streaming**:
  - `/api/admin/activity/stream`: Real-time Server-Sent Events stream for platform events (registrations, logins, catalog listings, order placement, status updates).
  - `/api/seller/orders/stream`: Real-time order notifications for sellers when their items are purchased.

---

## 🛠️ Tech Stack

### Backend
- **Language & Framework**: Java 17+, Spring Boot 3.3.4
- **Security**: Spring Security 6, Stateless JWT (HMAC-SHA256, Access & Refresh token rotation)
- **Data & Migration**: Spring Data JPA, Hibernate 6, MySQL 8, Flyway database migrations
- **Validation & Docs**: Bean Validation (`jakarta.validation`), Springdoc OpenAPI (`/swagger-ui.html`)
- **Exception Handling**: Global `@ControllerAdvice` returning structured RFC 7807 problem details

### Frontend
- **Framework & Build**: React 18, TypeScript, Vite
- **Styling & Design System**: Tailwind CSS v4, Lucide React, Framer Motion animations
- **State Management**: Zustand (Auth, Cart with vendor grouping, Theme with dark/light mode persistence)
- **Data Fetching**: TanStack React Query (caching, optimistic mutations)
- **UI & UX Components**: Radix UI primitives, `cmdk` command palette (⌘K / Ctrl+K), `sonner` notifications, `canvas-confetti` celebrations, `recharts` for gradient visual analytics.

---

## 🚀 Quick Start Guide

### Prerequisites
- Docker & Docker Compose **OR** local MySQL 8
- Java 17+ JDK (`temurin-17` or standard OpenJDK)
- Node.js 18+ and npm

### 1. Start MySQL 8 Database

Using Docker Compose:
```bash
docker compose up -d
```
*(Runs MySQL on port `3306` with database `cartly` and user `cartly:cartly`)*

---

### 2. Start Backend Service

```bash
cd backend
./mvnw spring-boot:run
```
*(Backend launches at `http://localhost:8080`. Flyway automatically migrates database schema on boot and initializes the administrative credentials.)*

**Default Admin Credentials (generated securely at startup):**
- **Email**: `admin@passu.com` (or `admin@cartly.com`)
- **Password**: `Admin@Passu2025!` (or `Admin@Cartly2025!`)

---

### 3. Start Frontend Service

```bash
cd frontend
npm install
npm run dev
```
*(Frontend is available at `http://localhost:5173` with automated proxying to the Spring Boot backend on port 8080.)*

---

## 🧪 Automated Testing & Stock Safety Verification

Run unit tests for multi-vendor checkout and atomic stock locking:
```bash
cd backend
./mvnw test
```

Verified test cases include:
1. `testCheckout_AtomicStockDeduction_Success`: multi-vendor order split across two sellers with proper stock decrement.
2. `testCheckout_InsufficientStock_ThrowsStockException`: atomic deduction prevention returning HTTP 409.
3. `testDeriveOverallStatus`: derivation of parent order status based on composite item states.

---

## 🔑 Key API Endpoints

| Category | Endpoint | Method | Role | Description |
|---|---|---|---|---|
| **Auth** | `/api/auth/register` | `POST` | Public | Register Buyer or Seller |
| **Auth** | `/api/auth/login` | `POST` | Public | Authenticate & receive JWT tokens |
| **Auth** | `/api/auth/refresh` | `POST` | Public | Rotate refresh token |
| **Public** | `/api/public/products` | `GET` | Public | Search catalog with filters & pagination |
| **Public** | `/api/public/categories` | `GET` | Public | Fetch distinct categories |
| **Buyer** | `/api/buyer/checkout` | `POST` | Buyer | Concurrency-safe atomic checkout |
| **Buyer** | `/api/buyer/orders` | `GET` | Buyer | Customer order history with timeline |
| **Buyer** | `/api/buyer/wishlist` | `GET/POST` | Buyer | Wishlist management with price-drop tracking |
| **Seller**| `/api/seller/products` | `GET/POST/PUT` | Seller | CRUD catalog management (scoped to seller) |
| **Seller**| `/api/seller/orders` | `GET/PATCH` | Seller | Kanban item status processing |
| **Seller**| `/api/seller/analytics` | `GET` | Seller | SQL aggregate sales & revenue performance |
| **Admin** | `/api/admin/users` | `GET/PATCH` | Admin | Manage & suspend platform accounts |
| **Admin** | `/api/admin/products` | `GET/PATCH` | Admin | Content moderation (Approve/Flag/Remove) |
| **Admin** | `/api/admin/activity/stream`| `GET` | Admin | Realtime Server-Sent Events event log |
