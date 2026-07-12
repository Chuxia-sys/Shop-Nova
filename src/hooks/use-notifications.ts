"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "@/types";
import { queryKeys, STALE_TIME, CACHE_TIME, POLLING } from "@/lib/query-keys";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "order" | "promotion" | "system" | "review";
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface NotificationsData {
  notifications: Notification[];
  unreadCount: number;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  dismiss: (notificationId: string) => void;
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
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches and manages the authenticated user's notifications.
 *
 * Features:
 * - Smart polling: polls every 60 seconds while page is visible
 * - Stale-while-revalidate: shows cached notifications immediately
 * - Optimistic mutations: mark as read, mark all as read, dismiss
 * - Query invalidation on mutations keeps data fresh
 */
export function useNotifications(): UseNotificationsReturn {
  const queryClient = useQueryClient();

  // -----------------------------------------------------------------------
  // Query
  // -----------------------------------------------------------------------

  const query = useQuery<ApiResponse<NotificationsData>>({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => fetchJson<ApiResponse<NotificationsData>>("/api/notifications"),
    staleTime: STALE_TIME.NOTIFICATIONS,
    gcTime: CACHE_TIME.NOTIFICATIONS,
    refetchInterval: POLLING.NOTIFICATIONS,
    refetchIntervalInBackground: false,  // Stop polling when tab hidden
  });

  // -----------------------------------------------------------------------
  // Mutations
  // -----------------------------------------------------------------------

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      fetchJson<ApiResponse<Notification>>(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        body: JSON.stringify({ isRead: true }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      fetchJson<ApiResponse<{ success: boolean }>>("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ markAllAsRead: true }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (notificationId: string) =>
      fetchJson<ApiResponse<void>>(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  // -----------------------------------------------------------------------
  // Callbacks
  // -----------------------------------------------------------------------

  const markAsRead = useCallback(
    (notificationId: string) => {
      markAsReadMutation.mutate(notificationId);
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const dismiss = useCallback(
    (notificationId: string) => {
      dismissMutation.mutate(notificationId);
    },
    [dismissMutation]
  );

  // -----------------------------------------------------------------------
  // Return
  // -----------------------------------------------------------------------

  const response = query.data?.data;

  return {
    notifications: response?.notifications ?? [],
    unreadCount: response?.unreadCount ?? 0,
    isLoading: query.isLoading,
    error: query.error?.message ?? query.data?.error ?? null,
    refetch: query.refetch,
    markAsRead,
    markAllAsRead,
    dismiss,
  };
}
