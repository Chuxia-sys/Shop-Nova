"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/shared/glass-card";

interface SidebarProps {
  children: ReactNode;
  className?: string;
  title?: string;
  sticky?: boolean;
}

export function Sidebar({ children, className, title, sticky = true }: SidebarProps) {
  return (
    <aside className={cn("hidden lg:block lg:w-64 xl:w-72 flex-shrink-0", className)}>
      <div className={sticky ? "sticky top-24" : ""}>
        <GlassCard className="p-5">
          {title && (
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">{title}</h3>
            </div>
          )}
          {children}
        </GlassCard>
      </div>
    </aside>
  );
}
