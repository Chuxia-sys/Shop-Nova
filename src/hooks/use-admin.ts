"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  ApiResponse,
  DashboardStats,
  OrderWithRelations,
  PaginatedResult,
  ProductWithRelations,
  RevenueData,
  SalesByCategory,
  TopProduct,
} from "@/types";
import { PAGINATION } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Firestore-based types (replacing Prisma types)
// ---------------------------------------------------------------------------
import type { FirestoreDocument } from "@/lib/firestore";

export interface Category extends FirestoreDocument {
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  isActive: boolean;
  order: number;
}

export interface Coupon extends FirestoreDocument {
  code: string;
  description?: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  perUserLimit: number;
  usedCount: number;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
}

export interface User extends FirestoreDocument {
  email: string;
  name: string | null;
  image: string | null;
  role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
  emailVerified: boolean;
  phone: string | null;
  isActive: boolean;
  isBanned: boolean;
  banReason: string | null;
  provider: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    let errorMessage: string;
    try {
      const body = await response.json();
      errorMessage = body.error ?? `Request failed with status ${response.status}`;
    } catch {
      errorMessage = `Request failed with status ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Query options helpers
// ---------------------------------------------------------------------------

function buildPaginationParams(
  page: number,
  limit: number,
  extra?: Record<string, string | undefined>
): URLSearchParams {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
  }
  return params;
}

// ---------------------------------------------------------------------------
// Admin Stats
// ---------------------------------------------------------------------------

/**
 * Fetches dashboard statistics from `/api/admin/stats`.
 */
export function useAdminStats() {
  return useQuery<ApiResponse<DashboardStats>>({
    queryKey: ["admin", "stats"],
    queryFn: () => fetchJson<ApiResponse<DashboardStats>>("/api/admin/stats"),
  });
}

/**
 * Fetches revenue chart data from `/api/admin/stats/revenue`.
 */
export function useAdminRevenueData(range?: "7d" | "30d" | "90d" | "1y") {
  const params = range ? `?range=${range}` : "";
  return useQuery<ApiResponse<RevenueData[]>>({
    queryKey: ["admin", "revenue", range],
    queryFn: () =>
      fetchJson<ApiResponse<RevenueData[]>>(`/api/admin/stats/revenue${params}`),
  });
}

/**
 * Fetches sales-by-category data from `/api/admin/stats/sales-by-category`.
 */
export function useAdminSalesByCategory() {
  return useQuery<ApiResponse<SalesByCategory[]>>({
    queryKey: ["admin", "sales-by-category"],
    queryFn: () =>
      fetchJson<ApiResponse<SalesByCategory[]>>("/api/admin/stats/sales-by-category"),
  });
}

/**
 * Fetches top-selling products from `/api/admin/stats/top-products`.
 */
export function useAdminTopProducts(limit: number = 10) {
  return useQuery<ApiResponse<TopProduct[]>>({
    queryKey: ["admin", "top-products", limit],
    queryFn: () =>
      fetchJson<ApiResponse<TopProduct[]>>(
        `/api/admin/stats/top-products?limit=${limit}`
      ),
  });
}

// ---------------------------------------------------------------------------
// Admin Products
// ---------------------------------------------------------------------------

export interface AdminProductsOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

/**
 * Fetches a paginated list of all products (admin view) from `/api/admin/products`.
 */
export function useAdminProducts(options?: AdminProductsOptions) {
  const { page = 1, limit = PAGINATION.ADMIN_PAGE_SIZE, search, status } = options ?? {};

  return useQuery<ApiResponse<PaginatedResult<ProductWithRelations>>>({
    queryKey: ["admin", "products", { page, limit, search, status }],
    queryFn: async () => {
      const params = buildPaginationParams(page, limit, { search, status });
      return fetchJson<ApiResponse<PaginatedResult<ProductWithRelations>>>(
        `/api/admin/products?${params.toString()}`
      );
    },
    placeholderData: (previousData) => previousData,
  });
}

// ---------------------------------------------------------------------------
// Admin Orders
// ---------------------------------------------------------------------------

export interface AdminOrdersOptions {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

/**
 * Fetches a paginated list of all orders (admin view) from `/api/admin/orders`.
 */
export function useAdminOrders(options?: AdminOrdersOptions) {
  const { page = 1, limit = PAGINATION.ADMIN_PAGE_SIZE, status, search } = options ?? {};

  return useQuery<ApiResponse<PaginatedResult<OrderWithRelations>>>({
    queryKey: ["admin", "orders", { page, limit, status, search }],
    queryFn: async () => {
      const params = buildPaginationParams(page, limit, { status, search });
      return fetchJson<ApiResponse<PaginatedResult<OrderWithRelations>>>(
        `/api/admin/orders?${params.toString()}`
      );
    },
    placeholderData: (previousData) => previousData,
  });
}

// ---------------------------------------------------------------------------
// Admin Users
// ---------------------------------------------------------------------------

export interface AdminUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

/**
 * Fetches a paginated list of users (admin view) from `/api/admin/users`.
 */
export function useAdminUsers(options?: AdminUsersOptions) {
  const { page = 1, limit = PAGINATION.ADMIN_PAGE_SIZE, search, role } = options ?? {};

  return useQuery<ApiResponse<PaginatedResult<User>>>({
    queryKey: ["admin", "users", { page, limit, search, role }],
    queryFn: async () => {
      const params = buildPaginationParams(page, limit, { search, role });
      return fetchJson<ApiResponse<PaginatedResult<User>>>(
        `/api/admin/users?${params.toString()}`
      );
    },
    placeholderData: (previousData) => previousData,
  });
}

// ---------------------------------------------------------------------------
// Admin Categories
// ---------------------------------------------------------------------------

/**
 * Fetches all categories (admin view) from `/api/admin/categories`.
 */
export function useAdminCategories() {
  return useQuery<ApiResponse<Category[]>>({
    queryKey: ["admin", "categories"],
    queryFn: () => fetchJson<ApiResponse<Category[]>>("/api/admin/categories"),
  });
}

// ---------------------------------------------------------------------------
// Admin Coupons
// ---------------------------------------------------------------------------

export interface AdminCouponsOptions {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

/**
 * Fetches coupons (admin view) from `/api/admin/coupons`.
 */
export function useAdminCoupons(options?: AdminCouponsOptions) {
  const { page = 1, limit = PAGINATION.ADMIN_PAGE_SIZE, search, isActive } = options ?? {};

  return useQuery<ApiResponse<PaginatedResult<Coupon>>>({
    queryKey: ["admin", "coupons", { page, limit, search, isActive }],
    queryFn: async () => {
      const params = buildPaginationParams(page, limit, {
        search,
        isActive: isActive !== undefined ? String(isActive) : undefined,
      });
      return fetchJson<ApiResponse<PaginatedResult<Coupon>>>(
        `/api/admin/coupons?${params.toString()}`
      );
    },
    placeholderData: (previousData) => previousData,
  });
}
