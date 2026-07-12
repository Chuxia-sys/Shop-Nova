"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function GlassCard({
  children,
  className,
  hover = true,
  glow = false,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/20 backdrop-blur-xl",
        "bg-white/10 dark:bg-white/5",
        "shadow-lg shadow-black/5",
        hover &&
          "transition-all duration-300 hover:shadow-xl hover:shadow-black/10 hover:scale-[1.02]",
        glow && "ring-1 ring-white/30",
        className
      )}
    >
      {children}
    </div>
  );
}
