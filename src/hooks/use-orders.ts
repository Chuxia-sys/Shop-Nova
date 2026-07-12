"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, OrderWithRelations, PaginatedResult } from "@/types";
import { PAGINATION } from "@/lib/constants";

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
 */
export function useOrders(options?: UseOrdersOptions): UseOrdersReturn {
  const { page = 1, limit = PAGINATION.ORDER_PAGE_SIZE, status } = options ?? {};

  const query = useQuery<ApiResponse<PaginatedResult<OrderWithRelations>>>({
    queryKey: ["orders", { page, limit, status }],
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
    placeholderData: (previousData) => previousData,
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
 */
export function useOrder(id: string): UseOrderReturn {
  const query = useQuery<ApiResponse<OrderWithRelations>>({
    queryKey: ["order", id],
    queryFn: () =>
      fetchJson<ApiResponse<OrderWithRelations>>(`/api/orders/${encodeURIComponent(id)}`),
    enabled: !!id,
  });

  return {
    order: query.data?.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? query.data?.error ?? null,
    refetch: query.refetch,
  };
}
