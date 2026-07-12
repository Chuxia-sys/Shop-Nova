"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Filter,
  Grid3X3,
  List,
  TrendingUp,
  Clock,
  ArrowLeft,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductGrid } from "@/components/shared/product-grid";
import { Pagination } from "@/components/shared/pagination";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SEO } from "@/components/shared/seo";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import { useSearch } from "@/hooks/use-search";
import { queryKeys } from "@/lib/query-keys";
import { SORT_OPTIONS, RATING_OPTIONS } from "@/lib/constants";
import { useDebounce } from "@/hooks/use-debounce";
import { cn, formatPrice } from "@/lib/utils";
import type { ApiResponse, ProductWithRelations, PaginatedResult, SearchFilters } from "@/types";

const DEFAULT_FILTERS: Partial<SearchFilters> = {
  category: undefined,
  brand: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  rating: undefined,
  inStock: undefined,
  onSale: undefined,
};

const RECENT_SEARCHES_KEY = "recent-searches";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ── Use the existing useSearch hook (TanStack Query powered) ────────
  const search = useSearch();
  const {
    results: products,
    pagination,
    isLoading,
    error,
    setQuery,
    setFilters,
    refetch,
  } = search;
  // We keep local mirrors for sort/page/filter UI state
  const [query, setLocalQuery] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  // Sync local query → useSearch hook query (debounced inside the hook)
  useEffect(() => {
    setQuery(query);
  }, [query, setQuery]);

  const [filters, setLocalFilters] = useState<Partial<SearchFilters>>(() => ({
    category: searchParams.get("category") || undefined,
    brand: searchParams.get("brand") || undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    rating: searchParams.get("rating") || undefined,
    inStock: searchParams.get("inStock") === "true" || undefined,
    onSale: searchParams.get("onSale") === "true" || undefined,
  }));

  // Sync local filters → useSearch hook filters
  useEffect(() => {
    setFilters(filters);
  }, [filters, setFilters]);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
      } catch {
        return [];
      }
    }
    return [];
  });

  // ── TanStack Query powers the search via useSearch hook ─────────────
  // The hook handles debouncing, caching, deduplication, and error recovery.
  // We still manage pagination/sort locally for the URL bar.

  // Update URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (page > 1) params.set("page", String(page));
    if (sort !== "newest") params.set("sort", sort);
    if (filters.category) params.set("category", filters.category);
    if (filters.brand) params.set("brand", filters.brand);
    if (filters.minPrice > 0) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice < 1000) params.set("maxPrice", String(filters.maxPrice));
    if (filters.rating) params.set("rating", filters.rating);
    if (filters.inStock) params.set("inStock", "true");
    if (filters.onSale) params.set("onSale", "true");

    const qs = params.toString();
    router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [query, page, sort, filters, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    // Save to recent searches
    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));

    setShowSuggestions(false);
    setPage(1);
  };

  const handleClearSearch = () => {
    setLocalQuery("");
    setPage(1);
    setShowSuggestions(false);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string | number | boolean) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value || undefined }));
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
    setLocalFilters(DEFAULT_FILTERS);
    setSort("newest");
    setPage(1);
  };

  const removeRecentSearch = (term: string) => {
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const hasActiveFilters =
    filters.category !== "" ||
    filters.brand !== "" ||
    filters.minPrice > 0 ||
    filters.maxPrice < 1000 ||
    filters.rating !== "" ||
    filters.inStock ||
    filters.onSale;

  const hasSearch = query.trim().length > 0;
  const hasResults = products.length > 0;

  const FilterContent = () => (
    <div className="space-y-6">
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
          {["electronics", "fashion", "home-living", "beauty", "sports", "books"].map((cat) => (
            <button
              key={cat}
              onClick={() => handleFilterChange("category", cat)}
              className={cn(
                "w-full text-left text-sm capitalize transition-colors hover:text-foreground",
                filters.category === cat
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {cat.replace("-", " & ")}
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
            setLocalFilters((prev) => ({ ...prev, minPrice: min || undefined, maxPrice: max || undefined }));
          }}
          className="mb-3"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatPrice(filters.minPrice)}</span>
          <span>{formatPrice(filters.maxPrice)}</span>
        </div>
      </div>

      <Separator />

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
        title={query ? `Search results for "${query}"` : "Search Products"}
        description="Search our product catalog"
        path="/search"
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4 py-6">
          {/* Breadcrumbs */}
          <Breadcrumbs items={[{ label: "Search" }]} className="mb-6" />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Search Products
            </h1>
            <p className="mt-2 text-muted-foreground">
              Find exactly what you&apos;re looking for
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative mx-auto mb-8 max-w-2xl"
          >
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products, categories, brands..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="h-12 pl-12 pr-20 text-base rounded-2xl border-2 focus-visible:ring-2"
                  autoFocus
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {query && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    className="rounded-full px-4"
                    disabled={!query.trim()}
                  >
                    Search
                  </Button>
                </div>
              </div>
            </form>

            {/* Suggestions / Recent Searches */}
            <AnimatePresence>
              {showSuggestions && !hasSearch && recentSearches.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border bg-background p-4 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Recent Searches
                    </h4>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-accent cursor-pointer"
                        onClick={() => {
                          setQuery(term);
                          setShowSuggestions(false);
                          setPage(1);
                        }}
                      >
                        <span className="text-sm">{term}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(term);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Remove ${term}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Results area */}
          {hasSearch && (
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

              {/* Results */}
              <div className="flex-1 min-w-0">
                {/* Toolbar */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card/50 p-3 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    {/* Mobile Filter Trigger */}
                    <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="lg:hidden">
                          <Filter className="mr-2 h-4 w-4" />
                          Filters
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-full max-w-sm overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle>Filters</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6">
                          {hasActiveFilters && (
                            <div className="mb-4 flex justify-end">
                              <button
                                onClick={() => {
                                  clearFilters();
                                  setMobileFiltersOpen(false);
                                }}
                                className="text-xs text-muted-foreground underline hover:text-foreground"
                              >
                                Clear all
                              </button>
                            </div>
                          )}
                          <FilterContent />
                        </div>
                      </SheetContent>
                    </Sheet>

                    {/* Results count */}
                    <p className="text-sm text-muted-foreground">
                      {isLoading ? (
                        "Searching..."
                      ) : (
                        <>
                          <span className="font-medium text-foreground">
                            {pagination.total}
                          </span>{" "}
                          result{pagination.total !== 1 ? "s" : ""} for{" "}
                          <span className="font-medium text-foreground">
                            &ldquo;{query}&rdquo;
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
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
                          {filters.category}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleFilterChange("category", "")}
                          />
                        </Badge>
                      )}
                      {(filters.minPrice > 0 || filters.maxPrice < 1000) && (
                        <Badge variant="secondary" className="gap-1">
                          {formatPrice(filters.minPrice)} - {formatPrice(filters.maxPrice)}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() =>
                              setLocalFilters((prev) => ({ ...prev, minPrice: undefined, maxPrice: undefined }))
                            }
                          />
                        </Badge>
                      )}
                      {filters.rating && (
                        <Badge variant="secondary" className="gap-1">
                          {filters.rating}+ Stars
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
                    title="Search failed"
                    description={error}
                    onRetry={fetchResults}
                  />
                ) : isLoading ? (
                  <ProductGrid isLoading products={[]} />
                ) : !hasResults ? (
                  <EmptyState
                    icon={Search}
                    title="No results found"
                    description={`We couldn't find any matches for "${query}". Try different keywords or check your filters.`}
                    action={
                      hasActiveFilters || query
                        ? {
                            label: "Clear Search",
                            onClick: () => {
                              handleClearSearch();
                              clearFilters();
                            },
                          }
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
                {pagination.totalPages > 1 && !isLoading && hasResults && (
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
          )}

          {/* Initial state - no search yet */}
          {!hasSearch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                <Search className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                What are you looking for?
              </h3>
              <p className="mb-6 max-w-md text-muted-foreground">
                Search across thousands of products to find exactly what you
                need.
              </p>

              {recentSearches.length > 0 && (
                <div className="w-full max-w-md">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Recent Searches
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <Badge
                        key={term}
                        variant="secondary"
                        className="cursor-pointer py-1.5 text-sm"
                        onClick={() => {
                          setQuery(term);
                          setPage(1);
                        }}
                      >
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 w-full max-w-md">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Popular Searches
                </h4>
                <div className="flex flex-wrap gap-2">
                  {["wireless headphones", "smartwatch", "sneakers", "laptop", "sunglasses"].map(
                    (term) => (
                      <Badge
                        key={term}
                        variant="outline"
                        className="cursor-pointer py-1.5 text-sm hover:bg-accent"
                        onClick={() => {
                          setQuery(term);
                          setPage(1);
                        }}
                      >
                        {term}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading search...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
