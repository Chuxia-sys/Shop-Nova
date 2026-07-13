"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWishlistStore } from "@/store/wishlist-store";
import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WishlistItemInput {
  productId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
}

export interface UseWishlistReturn {
  items: WishlistItemInput[];
  count: number;
  addItem: (item: WishlistItemInput) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  toggleItem: (item: WishlistItemInput) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
  isAdding: boolean;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function wishlistFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const result: ApiResponse = await response.json();
    throw new Error(result.error || `Wishlist sync failed (${response.status})`);
  }
  return response.json();
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Wraps the Zustand wishlist-store with TanStack Query mutations for server sync.
 *
 * - Optimistic local update first
 * - Server sync via useMutation
 * - Rollback on failure
 * - Query invalidation on success
 */
export function useWishlist(): UseWishlistReturn {
  const queryClient = useQueryClient();
  const {
    items,
    addItem: storeAddItem,
    removeItem: storeRemoveItem,
    isInWishlist,
    toggleItem: storeToggleItem,
    clearWishlist: storeClearWishlist,
    getCount,
  } = useWishlistStore();

  // -----------------------------------------------------------------------
  // Mutations
  // -----------------------------------------------------------------------

  const addMutation = useMutation({
    mutationFn: (productId: string) =>
      wishlistFetch<ApiResponse>("/api/wishlist", {
        method: "POST",
        body: JSON.stringify({ productId }),
      }),
    retry: 2,
    retryDelay: 1000,
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) =>
      wishlistFetch<ApiResponse>(
        `/api/wishlist?productId=${encodeURIComponent(productId)}`,
        { method: "DELETE" }
      ),
    retry: 1,
  });

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const addItem = useCallback(
    async (item: WishlistItemInput): Promise<void> => {
      storeAddItem(item);
      try {
        await addMutation.mutateAsync(item.productId);
      } catch (error) {
        storeRemoveItem(item.productId);
        throw error;
      }
    },
    [storeAddItem, storeRemoveItem, addMutation]
  );

  const removeItemFn = useCallback(
    async (productId: string): Promise<void> => {
      storeRemoveItem(productId);
      try {
        await removeMutation.mutateAsync(productId);
      } catch {
        // Non-blocking: local state is already updated
      }
    },
    [storeRemoveItem, removeMutation]
  );

  const toggleItem = useCallback(
    async (item: WishlistItemInput): Promise<void> => {
      const wasInWishlist = isInWishlist(item.productId);

      // Optimistic toggle
      storeToggleItem(item);

      try {
        if (wasInWishlist) {
          await removeMutation.mutateAsync(item.productId);
        } else {
          await addMutation.mutateAsync(item.productId);
        }
      } catch {
        // Revert toggle
        storeToggleItem(item);
      }
    },
    [isInWishlist, storeToggleItem, addMutation, removeMutation]
  );

  const clearWishlist = useCallback(async (): Promise<void> => {
    storeClearWishlist();

    try {
      await fetch("/api/wishlist", { method: "DELETE" });
    } catch {
      // Non-blocking: local state is already cleared
    }
  }, [storeClearWishlist]);

  return {
    items,
    count: getCount(),
    addItem,
    removeItem: removeItemFn,
    toggleItem,
    isInWishlist,
    clearWishlist,
    isAdding: addMutation.isPending || removeMutation.isPending,
  };
}
