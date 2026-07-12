"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, OrderWithRelations, PaginatedResult } from "@/types";
import { PAGINATION } from "@/lib/constants";
import { queryKeys, STALE_TIME, CACHE_TIME, POLLING } from "@/lib/query-keys";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseOrdersOptions {
  page?: number;
  limit?: number;
  status?: string;
}

export interface UseOrdersReturn {
  orders: OrderWithRelations[];
  pagination: PaginatedResult<OrderWithRelations>["pagination"] | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseOrderReturn {
  order: OrderWithRelations | null;
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
// useOrders
// ---------------------------------------------------------------------------

/**
 * Fetches the authenticated user's orders with pagination and optional status
 * filtering, using TanStack Query.
 *
 * Features:
 * - Smart polling: polls faster when orders are in active states (PENDING, CONFIRMED, PROCESSING)
 * - Falls back to slower polling when orders are in terminal states (DELIVERED, CANCELLED, REFUNDED)
 * - Stale-while-revalidate: shows cached orders immediately
 */
export function useOrders(options?: UseOrdersOptions): UseOrdersReturn {
  const { page = 1, limit = PAGINATION.ORDER_PAGE_SIZE, status } = options ?? {};

  const query = useQuery<ApiResponse<PaginatedResult<OrderWithRelations>>>({
    queryKey: queryKeys.orders.list({ page, limit, status }),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (status) params.set("status", status);

      return fetchJson<ApiResponse<PaginatedResult<OrderWithRelations>>>(
        `/api/orders?${params.toString()}`
      );
    },
    staleTime: STALE_TIME.ORDERS,
    gcTime: CACHE_TIME.ORDERS,
    placeholderData: (previousData) => previousData,
    // Smart polling: dynamically adjust based on order status
    refetchInterval: (query) => {
      const data = query.state.data?.data?.data;
      if (!data || data.length === 0) return POLLING.ORDER_PENDING;

      const activeStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"];
      const hasActive = data.some((o) => activeStatuses.includes(o.status));

      if (hasActive) return POLLING.ORDER_ACTIVE;   // 5s — active order
      return POLLING.ORDER_STALE;                    // 60s — terminal state
    },
    refetchIntervalInBackground: false,              // Stop polling when tab hidden
  });

  return {
    orders: query.data?.data?.data ?? [],
    pagination: query.data?.data?.pagination,
    isLoading: query.isLoading,
    error: query.error?.message ?? query.data?.error ?? null,
    refetch: query.refetch,
  };
}

// ---------------------------------------------------------------------------
// useOrder
// ---------------------------------------------------------------------------

/**
 * Fetches a single order by its ID, using TanStack Query.
 * The query is disabled when `id` is empty.
 *
 * Features:
 * - Smart polling: checks for status changes when order is active
 */
export function useOrder(id: string): UseOrderReturn {
  const query = useQuery<ApiResponse<OrderWithRelations>>({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () =>
      fetchJson<ApiResponse<OrderWithRelations>>(`/api/orders/${encodeURIComponent(id)}`),
    enabled: !!id,
    staleTime: STALE_TIME.ORDERS,
    gcTime: CACHE_TIME.ORDERS,
    // Poll while order is in active state
    refetchInterval: (query) => {
      const order = query.state.data?.data;
      if (!order) return false;
      const activeStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"];
      if (activeStatuses.includes(order.status)) return POLLING.ORDER_ACTIVE;
      return false; // Stop polling once terminal
    },
    refetchIntervalInBackground: false,
  });

  return {
    order: query.data?.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? query.data?.error ?? null,
    refetch: query.refetch,
  };
}
