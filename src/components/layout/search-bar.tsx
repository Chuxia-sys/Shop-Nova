"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Search,
  X,
  TrendingUp,
  Clock,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  category: string;
}

const popularSearches = [
  "Electronics",
  "Fashion",
  "Headphones",
  "Smartphones",
  "Sneakers",
  "Watches",
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

export function SearchBar() {
  const router = useRouter();
  const { isSearchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isSearchOpen]);

  // Search API call with debounce
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(debouncedQuery)}&limit=6`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.products || data || []);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const saveRecentSearch = useCallback(
    (term: string) => {
      const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(
        0, 6
      );
      setRecentSearches(updated);
      try {
        localStorage.setItem("recent-searches", JSON.stringify(updated));
      } catch {}
    },
    [recentSearches]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      setSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectResult = (slug: string) => {
    setSearchOpen(false);
    router.push(`/products/${slug}`);
  };

  const handlePopularClick = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("recent-searches");
    } catch {}
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    if (isSearchOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isSearchOpen, setSearchOpen]);

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[15vh]"
        >
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-2xl rounded-2xl border bg-background shadow-2xl mx-4 overflow-hidden"
          >
            {/* Search form */}
            <form onSubmit={handleSubmit} className="relative">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-16 border-0 bg-transparent pl-14 pr-24 text-lg shadow-none focus-visible:ring-0"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <kbd className="hidden rounded-md border bg-muted px-2 py-1 text-xs text-muted-foreground sm:inline-block">
                  ESC
                </kbd>
              </div>
            </form>

            {/* Results / Suggestions */}
            <div className="max-h-[50vh] overflow-y-auto border-t px-6 py-4">
              {/* Loading */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Search results */}
              {!isLoading && results.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Products
                  </h4>
                  <ul className="space-y-2">
                    {results.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectResult(item.slug)}
                          className="flex w-full items-center gap-4 rounded-lg p-2 transition-colors hover:bg-muted"
                        >
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.category}
                            </p>
                          </div>
                          <span className="text-sm font-semibold">
                            ${item.price.toFixed(2)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium text-primary transition-colors hover:bg-muted"
                  >
                    See all results
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* No results */}
              {!isLoading && query.length >= 2 && results.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No products found for &quot;{query}&quot;
                  </p>
                </div>
              )}

              {/* Initial state - popular & recent */}
              {!isLoading && query.length < 2 && (
                <div className="space-y-6">
                  {/* Recent searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <Clock className="mr-1.5 inline h-3 w-3" />
                          Recent Searches
                        </h4>
                        <button
                          type="button"
                          onClick={clearRecentSearches}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => handlePopularClick(term)}
                            className="rounded-full border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular searches */}
                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <TrendingUp className="mr-1.5 inline h-3 w-3" />
                      Popular Searches
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {popularSearches.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => handlePopularClick(term)}
                          className="rounded-full border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
