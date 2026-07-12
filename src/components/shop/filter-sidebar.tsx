"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { cn, formatPrice } from "@/lib/utils";
import { RATING_OPTIONS } from "@/lib/constants";

export interface FiltersState {
  category: string;
  brand: string;
  minPrice: number;
  maxPrice: number;
  rating: string;
  inStock: boolean;
  onSale: boolean;
  query: string;
}

export interface FilterSidebarProps {
  filters: FiltersState;
  categories: { id: string; name: string; slug: string }[];
  brands: { id: string; name: string; slug: string }[];
  onFilterChange: (key: keyof FiltersState, value: string | number | boolean) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export function FilterSidebar({
  filters,
  categories,
  brands,
  onFilterChange,
  hasActiveFilters,
  onClearFilters,
}: FilterSidebarProps) {
  return (
    <div className="space-y-6">
      {hasActiveFilters !== undefined && onClearFilters && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Search */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">Search</h4>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={filters.query}
            onChange={(e) => onFilterChange("query", e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Separator />

      {/* Categories */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">Category</h4>
        <div className="space-y-2">
          <button
            onClick={() => onFilterChange("category", "")}
            className={cn(
              "w-full text-left text-sm transition-colors hover:text-foreground",
              !filters.category ? "font-medium text-foreground" : "text-muted-foreground"
            )}
          >
            All Categories
          </button>
          {categories.slice(0, 8).map((cat) => (
            <button
              key={cat.id}
              onClick={() => onFilterChange("category", cat.slug)}
              className={cn(
                "w-full text-left text-sm transition-colors hover:text-foreground",
                filters.category === cat.slug
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">Price Range</h4>
        <Slider
          min={0}
          max={1000}
          step={10}
          value={[filters.minPrice, filters.maxPrice]}
          onValueChange={([min, max]) => {
            onFilterChange("minPrice", min);
            onFilterChange("maxPrice", max);
          }}
          className="mb-3"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatPrice(filters.minPrice)}</span>
          <span>{formatPrice(filters.maxPrice)}</span>
        </div>
      </div>

      <Separator />

      {/* Brands */}
      {brands.length > 0 && (
        <>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Brand</h4>
            <div className="space-y-2">
              <button
                onClick={() => onFilterChange("brand", "")}
                className={cn(
                  "w-full text-left text-sm transition-colors hover:text-foreground",
                  !filters.brand ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                All Brands
              </button>
              {brands.slice(0, 6).map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => onFilterChange("brand", brand.slug)}
                  className={cn(
                    "w-full text-left text-sm transition-colors hover:text-foreground",
                    filters.brand === brand.slug
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Rating */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">Minimum Rating</h4>
        <div className="space-y-2">
          {RATING_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Checkbox
                checked={filters.rating === String(option.value)}
                onCheckedChange={() =>
                  onFilterChange(
                    "rating",
                    filters.rating === String(option.value) ? "" : String(option.value)
                  )
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Other filters */}
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <Checkbox
            checked={filters.inStock}
            onCheckedChange={(checked) => onFilterChange("inStock", checked === true)}
          />
          <span>In Stock Only</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <Checkbox
            checked={filters.onSale}
            onCheckedChange={(checked) => onFilterChange("onSale", checked === true)}
          />
          <span>On Sale</span>
        </label>
      </div>
    </div>
  );
}
