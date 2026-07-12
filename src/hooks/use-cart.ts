"use client";

import { useCallback } from "react";
import { useCartStore } from "@/store/cart-store";
import type { ApiResponse } from "@/types";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AddToCartInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface CartItemDisplay {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  quantity: number;
  variantId?: string;
  variantName?: string;
  maxQuantity: number;
}

export interface UseCartReturn {
  items: CartItemDisplay[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  isOpen: boolean;
  addItem: (input: AddToCartInput) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SHIPPING_COST = SHIPPING_FEE;
const FREE_THRESHOLD = FREE_SHIPPING_THRESHOLD;

function computeSubtotal(items: CartItemDisplay[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function computeShipping(subtotal: number): number {
  return subtotal >= FREE_THRESHOLD ? 0 : SHIPPING_COST;
}

function computeTotal(subtotal: number, shipping: number): number {
  return subtotal + shipping;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Wraps the Zustand cart-store with server-side synchronisation.
 *
 * Performs optimistic local updates first, then syncs with the server.
 * If the server request fails, the local state is reverted.
 */
export function useCart(): UseCartReturn {
  const {
    items: storeItems,
    isOpen,
    addItem: storeAddItem,
    removeItem: storeRemoveItem,
    updateQuantity: storeUpdateQuantity,
    clearCart: storeClearCart,
    toggleCart,
    openCart,
    closeCart,
  } = useCartStore();

  // Cast to our display type
  const items = storeItems as unknown as CartItemDisplay[];

  // -----------------------------------------------------------------------
  // Derived values
  // -----------------------------------------------------------------------
  const subtotal = computeSubtotal(items);
  const shipping = computeShipping(subtotal);
  const total = computeTotal(subtotal, shipping);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const addItem = useCallback(
    async (input: AddToCartInput): Promise<void> => {
      // Build a temporary item to add to the store optimistically.
      // The store generates its own id.
      const tempItem = {
        productId: input.productId,
        variantId: input.variantId,
        quantity: input.quantity,
        name: "",
        slug: "",
        price: 0,
        compareAtPrice: null,
        image: "",
        maxQuantity: 999,
      };

      storeAddItem(tempItem as any);

      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const result: ApiResponse = await response.json();
          throw new Error(result.error || `Failed to sync cart (${response.status})`);
        }
      } catch (error) {
        // Revert optimistic update
        storeRemoveItem(input.productId, input.variantId);
        throw error;
      }
    },
    [storeAddItem, storeRemoveItem]
  );

  const removeItem = useCallback(
    async (productId: string, variantId?: string): Promise<void> => {
      const currentItem = storeItems.find(
        (i) => i.productId === productId && i.variantId === variantId
      );

      // Optimistic remove
      storeRemoveItem(productId, variantId);

      try {
        const params = new URLSearchParams({ productId });
        if (variantId) params.set("variantId", variantId);

        const response = await fetch(`/api/cart?${params.toString()}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const result: ApiResponse = await response.json();
          throw new Error(result.error || `Failed to sync cart (${response.status})`);
        }
      } catch (error) {
        // Revert: add the item back
        if (currentItem) {
          storeAddItem(currentItem as any);
        }
        throw error;
      }
    },
    [storeItems, storeRemoveItem, storeAddItem]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number, variantId?: string): Promise<void> => {
      const previousSnapshot = [...storeItems];

      // Optimistic update
      storeUpdateQuantity(productId, quantity, variantId);

      try {
        const response = await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity, variantId }),
        });

        if (!response.ok) {
          const result: ApiResponse = await response.json();
          throw new Error(result.error || `Failed to sync cart (${response.status})`);
        }
      } catch (error) {
        // Revert to previous snapshot
        storeClearCart();
        previousSnapshot.forEach((item) => storeAddItem(item as any));
        throw error;
      }
    },
    [storeItems, storeUpdateQuantity, storeClearCart, storeAddItem]
  );

  const clearCart = useCallback(async (): Promise<void> => {
    storeClearCart();

    try {
      const response = await fetch("/api/cart", { method: "DELETE" });

      if (!response.ok) {
        throw new Error(`Failed to clear cart on server (${response.status})`);
      }
    } catch {
      // Non-blocking: local state is already cleared
    }
  }, [storeClearCart]);

  return {
    items,
    itemCount,
    subtotal,
    shipping,
    total,
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
  };
}
