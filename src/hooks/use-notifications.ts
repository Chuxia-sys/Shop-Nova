"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "@/types";

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
// Constants
// ---------------------------------------------------------------------------

const NOTIFICATIONS_POLL_INTERVAL_MS = 60_000; // 60 seconds

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches and manages the authenticated user's notifications.
 *
 * Automatically polls for new notifications every 60 seconds and provides
 * actions to mark notifications as read (individually or in bulk) or dismiss them.
 */
export function useNotifications(): UseNotificationsReturn {
  const queryClient = useQueryClient();

  // -----------------------------------------------------------------------
  // Query
  // -----------------------------------------------------------------------

  const query = useQuery<ApiResponse<NotificationsData>>({
    queryKey: ["notifications"],
    queryFn: () => fetchJson<ApiResponse<NotificationsData>>("/api/notifications"),
    refetchInterval: NOTIFICATIONS_POLL_INTERVAL_MS,
    staleTime: 30_000,
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
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      fetchJson<ApiResponse<{ success: boolean }>>("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ markAllAsRead: true }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (notificationId: string) =>
      fetchJson<ApiResponse<void>>(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
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
