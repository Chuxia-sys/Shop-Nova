"use client";

import { ThemeProvider } from "next-themes";
import { Toaster as HotToaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartSheet } from "@/components/layout/cart-sheet";
import { GC_TIME } from "@/lib/query-keys";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Show cached data immediately while refetching in the background
            staleTime: 60 * 1000,                         // 1 min global default
            gcTime: GC_TIME.DEFAULT,                       // 5 min garbage collection
            retry: 3,                                      // Retry up to 3 times
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 10000),   // 1s → 2s → 4s → 8s → 10s cap
            refetchOnWindowFocus: true,                    // Auto-refresh when returning
            refetchOnReconnect: true,                      // Auto-refresh on network recovery
            refetchOnMount: true,                          // Always check freshness on mount
          },
          mutations: {
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* TanStack Query Devtools – only in development */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider delayDuration={300}>
          {children}
          <HotToaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                padding: "12px 16px",
                fontSize: "14px",
                boxShadow:
                  "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
              },
              success: {
                iconTheme: {
                  primary: "hsl(143, 85%, 50%)",
                  secondary: "hsl(143, 85%, 95%)",
                },
              },
              error: {
                iconTheme: {
                  primary: "hsl(0, 84%, 60%)",
                  secondary: "hsl(0, 84%, 95%)",
                },
              },
            }}
          />
          <Toaster />
          <CartSheet />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
