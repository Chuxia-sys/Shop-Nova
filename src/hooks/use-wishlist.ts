"use client";

import { useCallback } from "react";
import { useWishlistStore } from "@/store/wishlist-store";
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
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Wraps the Zustand wishlist-store with server-side synchronisation.
 *
 * Performs optimistic local updates first, then syncs with the server.
 */
export function useWishlist(): UseWishlistReturn {
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
  // Actions
  // -----------------------------------------------------------------------

  const addItem = useCallback(
    async (item: WishlistItemInput): Promise<void> => {
      // Optimistic add
      storeAddItem(item);

      try {
        const response = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: item.productId }),
        });

        if (!response.ok) {
          const result: ApiResponse = await response.json();
          throw new Error(result.error || `Failed to sync wishlist (${response.status})`);
        }
      } catch (error) {
        // Revert optimistic update
        storeRemoveItem(item.productId);
        throw error;
      }
    },
    [storeAddItem, storeRemoveItem]
  );

  const removeItem = useCallback(
    async (productId: string): Promise<void> => {
      storeRemoveItem(productId);

      try {
        const response = await fetch(
          `/api/wishlist?productId=${encodeURIComponent(productId)}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          const result: ApiResponse = await response.json();
          throw new Error(result.error || `Failed to sync wishlist (${response.status})`);
        }
      } catch {
        // Non-blocking: local state is already updated
      }
    },
    [storeRemoveItem]
  );

  const toggleItem = useCallback(
    async (item: WishlistItemInput): Promise<void> => {
      const wasInWishlist = isInWishlist(item.productId);

      // Optimistic toggle
      storeToggleItem(item);

      try {
        const method = wasInWishlist ? "DELETE" : "POST";

        if (method === "DELETE") {
          await fetch(
            `/api/wishlist?productId=${encodeURIComponent(item.productId)}`,
            { method: "DELETE" }
          );
        } else {
          await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: item.productId }),
          });
        }
      } catch {
        // Revert toggle
        storeToggleItem(item);
      }
    },
    [isInWishlist, storeToggleItem]
  );

  const clearWishlist = useCallback(async (): Promise<void> => {
    storeClearWishlist();

    try {
      const response = await fetch("/api/wishlist", { method: "DELETE" });

      if (!response.ok) {
        throw new Error(`Failed to clear wishlist on server (${response.status})`);
      }
    } catch {
      // Non-blocking: local state is already cleared
    }
  }, [storeClearWishlist]);

  return {
    items,
    count: getCount(),
    addItem,
    removeItem,
    toggleItem,
    isInWishlist,
    clearWishlist,
  };
}
