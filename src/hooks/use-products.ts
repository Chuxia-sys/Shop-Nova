"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, PaginatedResult, ProductWithRelations, SearchFilters } from "@/types";
import { PAGINATION } from "@/lib/constants";
import { queryKeys, STALE_TIME, CACHE_TIME } from "@/lib/query-keys";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProductsFilters = Omit<SearchFilters, "query">;

export interface UseProductsReturn {
  products: ProductWithRelations[];
  pagination: PaginatedResult<ProductWithRelations>["pagination"] | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseProductReturn {
  product: ProductWithRelations | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
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
// useProducts
// ---------------------------------------------------------------------------

/**
 * Fetches a paginated, filterable list of products from `/api/products`
 * using TanStack Query.
 *
 * Features:
 * - Stale-while-revalidate: instantly shows cached data, background-refetches
 * - Keeps previous page data while fetching the next (smooth pagination)
 * - Deduplicates identical requests across components
 */
export function useProducts(filters?: ProductsFilters): UseProductsReturn {
  const query = useQuery<ApiResponse<PaginatedResult<ProductWithRelations>>>({
    queryKey: queryKeys.products.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.category) params.set("category", filters.category);
      if (filters?.brand) params.set("brand", filters.brand);
      if (filters?.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
      if (filters?.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
      if (filters?.rating) params.set("rating", String(filters.rating));
      if (filters?.sort) params.set("sort", filters.sort);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.inStock) params.set("inStock", "true");
      if (filters?.onSale) params.set("onSale", "true");

      return fetchJson<ApiResponse<PaginatedResult<ProductWithRelations>>>(
        `/api/products?${params.toString()}`
      );
    },
    staleTime: STALE_TIME.PRODUCTS,
    gcTime: CACHE_TIME.PRODUCTS,
    placeholderData: (previousData) => previousData,
  });

  return {
    products: query.data?.data?.data ?? [],
    pagination: query.data?.data?.pagination,
    isLoading: query.isLoading,
    error: query.error?.message ?? query.data?.error ?? null,
    refetch: query.refetch,
  };
}

// ---------------------------------------------------------------------------
// useProduct
// ---------------------------------------------------------------------------

/**
 * Fetches a single product by its slug, using TanStack Query.
 * The query is disabled when `slug` is empty.
 */
export function useProduct(slug: string): UseProductReturn {
  const query = useQuery<ApiResponse<ProductWithRelations>>({
    queryKey: queryKeys.products.detail(slug),
    queryFn: () =>
      fetchJson<ApiResponse<ProductWithRelations>>(
        `/api/products/${encodeURIComponent(slug)}`
      ),
    enabled: !!slug,
    staleTime: STALE_TIME.PRODUCTS,
    gcTime: CACHE_TIME.PRODUCTS,
  });

  return {
    product: query.data?.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? query.data?.error ?? null,
    refetch: query.refetch,
  };
}

// ---------------------------------------------------------------------------
// useFeaturedProducts
// ---------------------------------------------------------------------------

/**
 * Fetches a list of featured products, using TanStack Query.
 */
export function useFeaturedProducts(): UseProductsReturn {
  const query = useQuery<ApiResponse<PaginatedResult<ProductWithRelations>>>({
    queryKey: queryKeys.products.featured(),
    queryFn: () =>
      fetchJson<ApiResponse<PaginatedResult<ProductWithRelations>>>(
        "/api/products?featured=true&limit=8"
      ),
    staleTime: STALE_TIME.PRODUCTS,
    gcTime: CACHE_TIME.PRODUCTS,
  });

  return {
    products: query.data?.data?.data ?? [],
    pagination: query.data?.data?.pagination,
    isLoading: query.isLoading,
    error: query.error?.message ?? query.data?.error ?? null,
    refetch: query.refetch,
  };
}
