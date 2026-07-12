// ---------------------------------------------------------------------------
// Query Key Factory
// ---------------------------------------------------------------------------
// Centralised, typed query keys for TanStack Query.
// Ensures consistency, eliminates magic strings, and enables fine-grained
// cache invalidation across the entire application.
// ---------------------------------------------------------------------------

import type { ProductsFilters } from "@/hooks/use-products";

export const queryKeys = {
  // ── Auth ────────────────────────────────────────────────────────────────
  auth: {
    all: ["auth"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
  },

  // ── Products ────────────────────────────────────────────────────────────
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters?: ProductsFilters) =>
      [...queryKeys.products.lists(), filters] as const,
    featured: () => [...queryKeys.products.all, "featured"] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (slug: string) => [...queryKeys.products.details(), slug] as const,
    search: (query: string, filters?: Record<string, unknown>) =>
      [...queryKeys.products.all, "search", query, filters] as const,
  },

  // ── Categories ──────────────────────────────────────────────────────────
  categories: {
    all: ["categories"] as const,
    list: (slug?: string) =>
      slug ? [...queryKeys.categories.all, slug] : queryKeys.categories.all,
  },

  // ── Brands ──────────────────────────────────────────────────────────────
  brands: {
    all: ["brands"] as const,
    list: () => queryKeys.brands.all,
  },

  // ── Cart ────────────────────────────────────────────────────────────────
  cart: {
    all: ["cart"] as const,
    detail: () => [...queryKeys.cart.all, "detail"] as const,
  },

  // ── Wishlist ────────────────────────────────────────────────────────────
  wishlist: {
    all: ["wishlist"] as const,
    detail: () => [...queryKeys.wishlist.all, "detail"] as const,
  },

  // ── Orders ──────────────────────────────────────────────────────────────
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.orders.lists(), params] as const,
    details: () => [...queryKeys.orders.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },

  // ── Notifications ───────────────────────────────────────────────────────
  notifications: {
    all: ["notifications"] as const,
    list: () => queryKeys.notifications.all,
  },

  // ── Admin ───────────────────────────────────────────────────────────────
  admin: {
    all: ["admin"] as const,
    stats: () => [...queryKeys.admin.all, "stats"] as const,
    revenue: (range?: string) =>
      [...queryKeys.admin.all, "revenue", range] as const,
    salesByCategory: () => [...queryKeys.admin.all, "sales-by-category"] as const,
    topProducts: (limit?: number) =>
      [...queryKeys.admin.all, "top-products", limit] as const,
    products: (params?: Record<string, unknown>) =>
      [...queryKeys.admin.all, "products", params] as const,
    orders: (params?: Record<string, unknown>) =>
      [...queryKeys.admin.all, "orders", params] as const,
    users: (params?: Record<string, unknown>) =>
      [...queryKeys.admin.all, "users", params] as const,
    categories: () => [...queryKeys.admin.all, "categories"] as const,
    coupons: (params?: Record<string, unknown>) =>
      [...queryKeys.admin.all, "coupons", params] as const,
  },

  // ── User Profile ────────────────────────────────────────────────────────
  user: {
    all: ["user"] as const,
    profile: () => [...queryKeys.user.all, "profile"] as const,
    addresses: () => [...queryKeys.user.all, "addresses"] as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Cache policy constants (milliseconds)
// ---------------------------------------------------------------------------

export const CACHE_TIME = {
  /** Products: 5 minutes — moderately volatile */
  PRODUCTS: 5 * 60 * 1000,
  /** Categories: 30 minutes — rarely changes */
  CATEGORIES: 30 * 60 * 1000,
  /** Brands: 30 minutes — rarely changes */
  BRANDS: 30 * 60 * 1000,
  /** User profile: 5 minutes */
  USER_PROFILE: 5 * 60 * 1000,
  /** Orders: 30 seconds — needs freshness but not real-time */
  ORDERS: 30 * 1000,
  /** Notifications: real-time polled */
  NOTIFICATIONS: 30 * 1000,
  /** Admin analytics: 1 minute */
  ANALYTICS: 60 * 1000,
  /** Admin settings: 1 hour */
  SETTINGS: 60 * 60 * 1000,
  /** Cart: 2 minutes */
  CART: 2 * 60 * 1000,
  /** Wishlist: 2 minutes */
  WISHLIST: 2 * 60 * 1000,
} as const;

// ---------------------------------------------------------------------------
// Stale time constants — how long before a refetch is triggered
// ---------------------------------------------------------------------------

export const STALE_TIME = {
  PRODUCTS: 2 * 60 * 1000,       // 2 min
  CATEGORIES: 10 * 60 * 1000,    // 10 min
  BRANDS: 10 * 60 * 1000,        // 10 min
  USER_PROFILE: 2 * 60 * 1000,   // 2 min
  ORDERS: 15 * 1000,             // 15 sec
  NOTIFICATIONS: 15 * 1000,      // 15 sec
  ANALYTICS: 30 * 1000,          // 30 sec
  SETTINGS: 30 * 60 * 1000,      // 30 min
  CART: 60 * 1000,               // 1 min
  WISHLIST: 60 * 1000,           // 1 min
} as const;

// ---------------------------------------------------------------------------
// GC time constants — how long unused data stays in memory
// ---------------------------------------------------------------------------

export const GC_TIME = {
  DEFAULT: 5 * 60 * 1000,        // 5 min
  PRODUCTS: 10 * 60 * 1000,      // 10 min
  CATEGORIES: 30 * 60 * 1000,    // 30 min
  USER_PROFILE: 10 * 60 * 1000,  // 10 min
} as const;

// ---------------------------------------------------------------------------
// Polling intervals (dynamic)
// ---------------------------------------------------------------------------

export const POLLING = {
  /** Initial aggressive poll for order status */
  ORDER_ACTIVE: 5 * 1000,        // 5 sec
  /** Moderate poll for pending orders */
  ORDER_PENDING: 15 * 1000,      // 15 sec
  /** Slow poll for completed/finished states */
  ORDER_STALE: 60 * 1000,        // 60 sec
  /** Notifications */
  NOTIFICATIONS: 60 * 1000,      // 60 sec
  /** Admin dashboard */
  ADMIN_DASHBOARD: 30 * 1000,    // 30 sec
  /** Admin analytics */
  ADMIN_ANALYTICS: 60 * 1000,    // 60 sec
} as const;
