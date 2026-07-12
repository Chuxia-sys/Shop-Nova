"use client";

import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/shared/product-card";
import { SkeletonCard } from "@/components/shared/skeleton-card";
import type { ProductWithRelations } from "@/types";

interface ProductGridProps {
  products: ProductWithRelations[];
  isLoading?: boolean;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    wide?: number;
  };
  className?: string;
}

export function ProductGrid({
  products,
  isLoading = false,
  columns,
  className,
}: ProductGridProps) {
  const gridCols = {
    mobile: columns?.mobile ?? 1,
    tablet: columns?.tablet ?? 2,
    desktop: columns?.desktop ?? 3,
    wide: columns?.wide ?? 4,
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "grid gap-6",
          `grid-cols-${gridCols.mobile}`,
          `sm:grid-cols-${gridCols.tablet}`,
          `lg:grid-cols-${gridCols.desktop}`,
          `xl:grid-cols-${gridCols.wide}`,
          className
        )}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid gap-6",
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
