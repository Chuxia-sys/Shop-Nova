"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
  category: {
    name: string;
    slug: string;
    image: string;
    description?: string;
  };
  className?: string;
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  return (
    <Link href={`/products?category=${category.slug}`}>
      <Card
        className={cn(
          "group relative overflow-hidden border-0 shadow-md transition-all duration-500 hover:shadow-xl",
          className
        )}
      >
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={category.image}
            alt={category.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <CardContent className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-xl font-bold text-white">{category.name}</h3>
          {category.description && (
            <p className="mt-1 text-sm text-white/80">{category.description}</p>
          )}
          <div className="mt-3 flex items-center gap-1 text-sm font-medium text-white/90 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span>Shop now</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
