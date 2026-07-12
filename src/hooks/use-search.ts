"use client";

import { useCallback, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, PaginatedResult, ProductWithRelations, SearchFilters } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseSearchReturn {
  results: ProductWithRelations[];
  pagination: PaginatedResult<ProductWithRelations>["pagination"] | undefined;
  isLoading: boolean;
  error: string | null;
  query: string;
  setQuery: (query: string) => void;
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearSearch: () => void;
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
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
// Constants
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 350;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Provides search functionality with debounced queries.
 * Uses TanStack Query for:
 * - Request deduplication (identical queries share one request)
 * - Automatic caching (cached results show instantly)
 * - Stale-while-revalidate (background refetch keeps data fresh)
 * - Built-in error handling & retry
 * - No manual AbortController needed
 */
export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState<string>("");
  const [filters, setFiltersState] = useState<SearchFilters>({});

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  // Build search params
  const params = buildSearchParams(debouncedQuery, filters);
  const hasQuery = debouncedQuery.trim().length > 0;
  const hasFilters = Object.keys(filters).length > 0;
  const enabled = hasQuery || hasFilters;

  // -----------------------------------------------------------------------
  // TanStack Query – handles deduplication, caching, background refetch
  // -----------------------------------------------------------------------

  const queryResult = useQuery<ApiResponse<PaginatedResult<ProductWithRelations>>>({
    queryKey: queryKeys.products.search(debouncedQuery, filters),
    queryFn: () =>
      fetchJson<ApiResponse<PaginatedResult<ProductWithRelations>>>(
        `/api/products/search?${params}`
      ),
    enabled,
    staleTime: 60 * 1000,        // 1 min — search results change infrequently
    placeholderData: keepPreviousData,
  });

  // -----------------------------------------------------------------------
  // Filter helpers
  // -----------------------------------------------------------------------

  const setFilters = useCallback((partial: Partial<SearchFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setFiltersState({});
  }, []);

  return {
    results: queryResult.data?.data?.data ?? [],
    pagination: queryResult.data?.data?.pagination,
    isLoading: queryResult.isLoading,
    error: queryResult.error?.message ?? queryResult.data?.error ?? null,
    query,
    setQuery,
    filters,
    setFilters,
    clearSearch,
    refetch: queryResult.refetch,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSearchParams(query: string, filters: SearchFilters): string {
  const params = new URLSearchParams();
  const trimmedQuery = query.trim();

  if (trimmedQuery) params.set("q", trimmedQuery);
  if (filters.category) params.set("category", filters.category);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
  if (filters.rating) params.set("rating", String(filters.rating));
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page) params.set("page", String(filters.page ?? 1));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.inStock) params.set("inStock", "true");
  if (filters.onSale) params.set("onSale", "true");

  return params.toString();
}
