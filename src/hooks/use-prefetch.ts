"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, ProductWithRelations } from "@/types";

// ---------------------------------------------------------------------------
// useProductPrefetch
// ---------------------------------------------------------------------------

/**
 * Returns a callback that prefetches a product detail page.
 *
 * Intended to be called on hover (onMouseEnter) over a ProductCard link
 * so the product data is already in the cache before the user clicks.
 */
export function useProductPrefetch() {
  const queryClient = useQueryClient();

  const prefetchProduct = useCallback(
    (slug: string) => {
      if (!slug) return;

      // Avoid re-fetching if data is already in cache and fresh
      const cached = queryClient.getQueryData(queryKeys.products.detail(slug));
      if (cached) return;

      queryClient.prefetchQuery<ApiResponse<ProductWithRelations>>({
        queryKey: queryKeys.products.detail(slug),
        queryFn: () =>
          fetch(`/api/products/${encodeURIComponent(slug)}`).then((res) => res.json()),
        staleTime: 2 * 60 * 1000, // 2 min — matches useProduct staleTime
      });
    },
    [queryClient]
  );

  return prefetchProduct;
}

// ---------------------------------------------------------------------------
// useCategoryPrefetch
// ---------------------------------------------------------------------------

/**
 * Returns a callback that prefetches products for a given category slug.
 * Useful for prefetching category pages on hover.
 */
export function useCategoryPrefetch() {
  const queryClient = useQueryClient();

  const prefetchCategory = useCallback(
    (categorySlug: string) => {
      if (!categorySlug) return;

      queryClient.prefetchQuery({
        queryKey: queryKeys.products.list({ category: categorySlug, limit: 12 }),
        queryFn: () =>
          fetch(`/api/products?category=${encodeURIComponent(categorySlug)}&limit=12`).then(
            (res) => res.json()
          ),
        staleTime: 2 * 60 * 1000,
      });
    },
    [queryClient]
  );

  return prefetchCategory;
}
