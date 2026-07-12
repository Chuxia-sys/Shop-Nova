"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/store/cart-store";
import { queryKeys } from "@/lib/query-keys";
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
  isAdding: boolean;
  isRemoving: boolean;
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

/** Shared helper for throwing on non-ok fetch responses. */
async function cartFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const result: ApiResponse = await response.json();
    throw new Error(result.error || `Cart sync failed (${response.status})`);
  }
  return response.json();
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Wraps the Zustand cart-store with TanStack Query mutations for server sync.
 *
 * - Optimistic local update first
 * - Server sync via useMutation
 * - Rollback on failure
 * - Query invalidation on success
 */
export function useCart(): UseCartReturn {
  const queryClient = useQueryClient();
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

  const items = storeItems as unknown as CartItemDisplay[];

  // -----------------------------------------------------------------------
  // Derived values
  // -----------------------------------------------------------------------
  const subtotal = computeSubtotal(items);
  const shipping = computeShipping(subtotal);
  const total = computeTotal(subtotal, shipping);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // -----------------------------------------------------------------------
  // Mutations
  // -----------------------------------------------------------------------

  /** Invalidate product queries after any cart change to reflect stock. */
  const invalidateAfterCartChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
  }, [queryClient]);

  const addMutation = useMutation({
    mutationFn: (input: AddToCartInput) =>
      cartFetch<ApiResponse>("/api/cart", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onMutate: async (input) => {
      // Optimistic add
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
    },
    onError: (_err, input) => {
      // Rollback optimistic update
      storeRemoveItem(input.productId, input.variantId);
    },
    onSuccess: () => {
      invalidateAfterCartChange();
    },
    retry: 2,
    retryDelay: 1000,
  });

  const removeMutation = useMutation({
    mutationFn: ({ productId, variantId }: { productId: string; variantId?: string }) => {
      const params = new URLSearchParams({ productId });
      if (variantId) params.set("variantId", variantId);
      return cartFetch<ApiResponse>(`/api/cart?${params.toString()}`, { method: "DELETE" });
    },
    onMutate: async ({ productId, variantId }) => {
      // Snapshot for rollback
      const snapshot = storeItems.find(
        (i) => i.productId === productId && i.variantId === variantId
      );
      storeRemoveItem(productId, variantId);
      return { snapshot };
    },
    onError: (_err, { productId, variantId }, context) => {
      // Rollback — restore the item
      if (context?.snapshot) {
        storeAddItem(context.snapshot as any);
      }
    },
    onSuccess: () => {
      invalidateAfterCartChange();
    },
    retry: 2,
    retryDelay: 1000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ productId, quantity, variantId }: { productId: string; quantity: number; variantId?: string }) =>
      cartFetch<ApiResponse>("/api/cart", {
        method: "PATCH",
        body: JSON.stringify({ productId, quantity, variantId }),
      }),
    onMutate: async ({ productId, quantity, variantId }) => {
      // Snapshot for rollback
      const snapshot = [...storeItems];
      storeUpdateQuantity(productId, quantity, variantId);
      return { snapshot };
    },
    onError: (_err, { productId, quantity, variantId }, context) => {
      // Rollback
      if (context?.snapshot) {
        storeClearCart();
        context.snapshot.forEach((item) => storeAddItem(item as any));
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  const clearMutation = useMutation({
    mutationFn: () =>
      cartFetch<ApiResponse>("/api/cart", { method: "DELETE" }),
    onMutate: async () => {
      storeClearCart();
    },
    onError: () => {
      // Best-effort: state stays cleared locally
    },
  });

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  const addItem = useCallback(
    async (input: AddToCartInput) => { await addMutation.mutateAsync(input); },
    [addMutation]
  );

  const removeItem = useCallback(
    async (productId: string, variantId?: string) => {
      await removeMutation.mutateAsync({ productId, variantId });
    },
    [removeMutation]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number, variantId?: string) => {
      await updateMutation.mutateAsync({ productId, quantity, variantId });
    },
    [updateMutation]
  );

  const clearCartFn = useCallback(
    async () => { await clearMutation.mutateAsync(); },
    [clearMutation]
  );

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
    clearCart: clearCartFn,
    toggleCart,
    openCart,
    closeCart,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
