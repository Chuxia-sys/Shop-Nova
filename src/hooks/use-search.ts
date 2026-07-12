"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import type { ApiResponse, PaginatedResult, ProductWithRelations, SearchFilters } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseSearchReturn {
  results: ProductWithRelations[];
  isLoading: boolean;
  query: string;
  setQuery: (query: string) => void;
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearSearch: () => void;
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
 * Fetches results from `/api/products/search` whenever the debounced query
 * or any filter value changes.
 */
export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState<string>("");
  const [filters, setFiltersState] = useState<SearchFilters>({});
  const [results, setResults] = useState<ProductWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  // -----------------------------------------------------------------------
  // Filter helpers
  // -----------------------------------------------------------------------

  const setFilters = useCallback((partial: Partial<SearchFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setFiltersState({});
    setResults([]);
    setError(null);
  }, []);

  // -----------------------------------------------------------------------
  // Fetch results
  // -----------------------------------------------------------------------

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();
    const hasQuery = trimmedQuery.length > 0;
    const hasFilters = Object.keys(filters).length > 0;

    if (!hasQuery && !hasFilters) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

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

        const response = await fetch(`/api/products/search?${params.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          // 404 is acceptable when no results match
          if (response.status === 404) {
            setResults([]);
            return;
          }
          throw new Error(`Search request failed (${response.status})`);
        }

        const result: ApiResponse<PaginatedResult<ProductWithRelations>> =
          await response.json();

        if (result.success && result.data) {
          setResults(result.data.data);
        } else {
          setResults([]);
          setError(result.error ?? "No results found.");
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Request was cancelled; do nothing
          return;
        }
        const message =
          err instanceof TypeError
            ? "Network error. Please check your connection."
            : err instanceof Error
              ? err.message
              : "An unexpected error occurred during search.";

        setError(message);
        setResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, filters]);

  return {
    results,
    isLoading,
    query,
    setQuery,
    filters,
    setFilters,
    clearSearch,
  };
}
