"use client";

import { Suspense, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  Search,
  Filter,
  Grid3X3,
  List,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ProductGrid } from "@/components/shared/product-grid";
import { Pagination } from "@/components/shared/pagination";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SEO } from "@/components/shared/seo";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import { useProducts } from "@/hooks/use-products";
import { queryKeys } from "@/lib/query-keys";
import { SORT_OPTIONS, RATING_OPTIONS } from "@/lib/constants";
import { useDebounce } from "@/hooks/use-debounce";
import { cn, formatPrice } from "@/lib/utils";
import type { ApiResponse, ProductWithRelations, PaginatedResult } from "@/types";

const MOBILE_FILTER_BREAKPOINT = 1024;

interface FiltersState {
  category: string;
  brand: string;
  minPrice: number;
  maxPrice: number;
  rating: string;
  inStock: boolean;
  onSale: boolean;
  query: string;
}

const DEFAULT_FILTERS: FiltersState = {
  category: "",
  brand: "",
  minPrice: 0,
  maxPrice: 1000,
  rating: "",
  inStock: false,
  onSale: false,
  query: "",
};

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filters state
  const [filters, setFilters] = useState<FiltersState>(() => ({
    category: searchParams.get("category") || "",
    brand: searchParams.get("brand") || "",
    minPrice: Number(searchParams.get("minPrice")) || 0,
    maxPrice: Number(searchParams.get("maxPrice")) || 1000,
    rating: searchParams.get("rating") || "",
    inStock: searchParams.get("inStock") === "true",
    onSale: searchParams.get("onSale") === "true",
    query: searchParams.get("q") || "",
  }));

  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const debouncedFilters = useDebounce(filters, 300);

  // ── TanStack Query: categories (30-min stale, 60-min cache) ────────
  const categoriesQuery = useQuery<ApiResponse<{ id: string; name: string; slug: string }[]>>({
    queryKey: queryKeys.categories.list(),
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
  const categories = categoriesQuery.data?.data ?? [];

  // ── TanStack Query: brands (30-min stale, 60-min cache) ────────────
  const brandsQuery = useQuery<ApiResponse<{ id: string; name: string; slug: string }[]>>({
    queryKey: queryKeys.brands.list(),
    queryFn: async () => {
      const res = await fetch("/api/brands");
      if (!res.ok) throw new Error("Failed to fetch brands");
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
  const brands = brandsQuery.data?.data ?? [];

  // ── TanStack Query: products (via useProducts hook) ────────────────
  const {
    products,
    pagination,
    isLoading,
    error,
  } = useProducts({
    category: debouncedFilters.category || undefined,
    brand: debouncedFilters.brand || undefined,
    minPrice: debouncedFilters.minPrice > 0 ? debouncedFilters.minPrice : undefined,
    maxPrice: debouncedFilters.maxPrice < 1000 ? debouncedFilters.maxPrice : undefined,
    rating: debouncedFilters.rating ? Number(debouncedFilters.rating) : undefined,
    sort,
    page,
    limit: 12,
    inStock: debouncedFilters.inStock || undefined,
    onSale: debouncedFilters.onSale || undefined,
  });

  // Update URL search params
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (sort !== "newest") params.set("sort", sort);
    if (debouncedFilters.category) params.set("category", debouncedFilters.category);
    if (debouncedFilters.brand) params.set("brand", debouncedFilters.brand);
    if (debouncedFilters.minPrice > 0) params.set("minPrice", String(debouncedFilters.minPrice));
    if (debouncedFilters.maxPrice < 1000) params.set("maxPrice", String(debouncedFilters.maxPrice));
    if (debouncedFilters.rating) params.set("rating", debouncedFilters.rating);
    if (debouncedFilters.inStock) params.set("inStock", "true");
    if (debouncedFilters.onSale) params.set("onSale", "true");
    if (debouncedFilters.query) params.set("q", debouncedFilters.query);

    const qs = params.toString();
    router.replace(`/products${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [page, sort, debouncedFilters, router]);

  const handleFilterChange = (key: keyof FiltersState, value: string | number | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSort("newest");
    setPage(1);
  };

  const hasActiveFilters =
    filters.category !== "" ||
    filters.brand !== "" ||
    filters.minPrice > 0 ||
    filters.maxPrice < 1000 ||
    filters.rating !== "" ||
    filters.inStock ||
    filters.onSale ||
    filters.query !== "";

  const activeFilterCount = [
    filters.category,
    filters.brand,
    filters.rating,
    filters.inStock ? "stock" : "",
    filters.onSale ? "sale" : "",
    filters.query,
  ].filter(Boolean).length +
    (filters.minPrice > 0 || filters.maxPrice < 1000 ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">Search</h4>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={filters.query}
            onChange={(e) => handleFilterChange("query", e.target.value)}
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
            onClick={() => handleFilterChange("category", "")}
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
              onClick={() => handleFilterChange("category", cat.slug)}
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
            setFilters((prev) => ({ ...prev, minPrice: min, maxPrice: max }));
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
                onClick={() => handleFilterChange("brand", "")}
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
                  onClick={() => handleFilterChange("brand", brand.slug)}
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
                  handleFilterChange(
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
            onCheckedChange={(checked) => handleFilterChange("inStock", checked === true)}
          />
          <span>In Stock Only</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <Checkbox
            checked={filters.onSale}
            onCheckedChange={(checked) => handleFilterChange("onSale", checked === true)}
          />
          <span>On Sale</span>
        </label>
      </div>
    </div>
  );

  return (
    <>
      <SEO
        title="Products"
        description="Browse our collection of premium products"
        path="/products"
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4 py-6">
          {/* Breadcrumbs */}
          <Breadcrumbs items={[{ label: "Products" }]} className="mb-6" />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              All Products
            </h1>
            <p className="mt-2 text-muted-foreground">
              Discover our curated collection of premium products
            </p>
          </motion.div>

          <div className="lg:flex lg:gap-8">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden lg:block lg:w-64 xl:w-72 flex-shrink-0">
              <div className="sticky top-24">
                <GlassCard className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">Filters</h3>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-muted-foreground underline hover:text-foreground"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <FilterContent />
                </GlassCard>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card/50 p-3 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  {/* Mobile Filter Trigger */}
                  <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden">
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                          <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-full max-w-sm overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <div className="mb-4 flex justify-end">
                          {hasActiveFilters && (
                            <button
                              onClick={() => {
                                clearFilters();
                                setMobileFiltersOpen(false);
                              }}
                              className="text-xs text-muted-foreground underline hover:text-foreground"
                            >
                              Clear all
                            </button>
                          )}
                        </div>
                        <FilterContent />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Results count */}
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? (
                      "Loading..."
                    ) : (
                      <>
                        <span className="font-medium text-foreground">{pagination.total}</span>{" "}
                        product{pagination.total !== 1 ? "s" : ""} found
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* View mode toggle */}
                  <div className="hidden items-center rounded-md border sm:flex">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "rounded-l-md p-2 transition-colors",
                        viewMode === "grid"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      aria-label="Grid view"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "rounded-r-md p-2 transition-colors",
                        viewMode === "list"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      aria-label="List view"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Sort */}
                  <Select value={sort} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>

              {/* Active filter badges */}
              <AnimatePresence>
                {hasActiveFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 flex flex-wrap items-center gap-2"
                  >
                    {filters.category && (
                      <Badge variant="secondary" className="gap-1">
                        Category: {filters.category}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleFilterChange("category", "")}
                        />
                      </Badge>
                    )}
                    {filters.brand && (
                      <Badge variant="secondary" className="gap-1">
                        Brand: {filters.brand}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleFilterChange("brand", "")}
                        />
                      </Badge>
                    )}
                    {(filters.minPrice > 0 || filters.maxPrice < 1000) && (
                      <Badge variant="secondary" className="gap-1">
                        Price: {formatPrice(filters.minPrice)} - {formatPrice(filters.maxPrice)}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() =>
                            setFilters((prev) => ({ ...prev, minPrice: 0, maxPrice: 1000 }))
                          }
                        />
                      </Badge>
                    )}
                    {filters.rating && (
                      <Badge variant="secondary" className="gap-1">
                        {filters.rating} Stars & Up
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleFilterChange("rating", "")}
                        />
                      </Badge>
                    )}
                    {filters.inStock && (
                      <Badge variant="secondary" className="gap-1">
                        In Stock
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleFilterChange("inStock", false)}
                        />
                      </Badge>
                    )}
                    {filters.onSale && (
                      <Badge variant="secondary" className="gap-1">
                        On Sale
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleFilterChange("onSale", false)}
                        />
                      </Badge>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Products */}
              {error ? (
                <ErrorState
                  title="Failed to load products"
                  description={error}
                  onRetry={fetchProducts}
                />
              ) : isLoading ? (
                <ProductGrid isLoading products={[]} />
              ) : products.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No products found"
                  description="Try adjusting your filters or search query"
                  action={
                    hasActiveFilters
                      ? { label: "Clear Filters", onClick: clearFilters }
                      : undefined
                  }
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductGrid products={products} />
                </motion.div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && !isLoading && products.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="mt-10"
                >
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    onPageChange={handlePageChange}
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading products...</p>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
