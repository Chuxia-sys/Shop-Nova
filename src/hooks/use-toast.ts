"use client";

import { toast as hotToast } from "react-hot-toast";

type ToastOptions = {
  message: string;
  description?: string;
  duration?: number;
};

function success(message: string, description?: string) {
  hotToast.success(message, {
    duration: 4000,
    style: {
      background: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
      border: "1px solid hsl(143, 85%, 50%)",
    },
  });
}

function error(message: string, description?: string) {
  hotToast.error(message, {
    duration: 5000,
    style: {
      background: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
      border: "1px solid hsl(0, 84%, 60%)",
    },
  });
}

function info(message: string, description?: string) {
  hotToast(message, {
    duration: 4000,
    style: {
      background: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
      border: "1px solid hsl(217, 91%, 60%)",
    },
  });
}

function loading(message: string) {
  return hotToast.loading(message, {
    style: {
      background: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
    },
  });
}

function dismiss(toastId?: string) {
  hotToast.dismiss(toastId);
}

export const toast = {
  success,
  error,
  info,
  loading,
  dismiss,
};

export function useToast() {
  return { toast };
}
