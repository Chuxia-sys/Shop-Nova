"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Search,
  Loader2,
  TrendingUp,
  Clock,
  ArrowRight,
  Command,
  File,
  ShoppingBag,
  User,
  Settings,
  HelpCircle,
} from "lucide-react";

interface SearchSuggestion {
  id: string;
  label: string;
  description?: string;
  type: "product" | "page" | "category";
  href: string;
  icon?: typeof Search;
}

const pageSuggestions: SearchSuggestion[] = [
  { id: "shop", label: "Shop All Products", type: "page", href: "/products", icon: ShoppingBag },
  { id: "dashboard", label: "My Dashboard", type: "page", href: "/dashboard", icon: User },
  { id: "wishlist", label: "Wishlist", type: "page", href: "/wishlist", icon: ShoppingBag },
  { id: "settings", label: "Account Settings", type: "page", href: "/dashboard", icon: Settings },
  { id: "faq", label: "FAQ", type: "page", href: "/faq", icon: HelpCircle },
];

const popularSearches = [
  "Electronics",
  "Fashion",
  "Headphones",
  "Smartphones",
  "Sneakers",
  "Watches",
  "Home Decor",
  "Beauty",
];

export function SearchCommand() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cmd-recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, []);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Search with debounce
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) {
      setResults(pageSuggestions);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          const products: SearchSuggestion[] = (data.products || data || []).map(
            (p: { id: string; name: string; slug: string; category?: { name: string } }) => ({
              id: p.id,
              label: p.name,
              description: p.category?.name,
              type: "product",
              href: `/products/${p.slug}`,
              icon: File,
            })
          );
          const filteredPages = pageSuggestions.filter((p) =>
            p.label.toLowerCase().includes(debouncedQuery.toLowerCase())
          );
          setResults([...products, ...filteredPages]);
        } else {
          setResults(
            pageSuggestions.filter((p) =>
              p.label.toLowerCase().includes(debouncedQuery.toLowerCase())
            )
          );
        }
      } catch {
        setResults(
          pageSuggestions.filter((p) =>
            p.label.toLowerCase().includes(debouncedQuery.toLowerCase())
          )
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  const saveRecentSearch = useCallback(
    (term: string) => {
      const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
      setRecentSearches(updated);
      try {
        localStorage.setItem("cmd-recent-searches", JSON.stringify(updated));
      } catch {}
    },
    [recentSearches]
  );

  const handleSelect = (item: SearchSuggestion) => {
    saveRecentSearch(item.label);
    setIsOpen(false);
    router.push(item.href);
  };

  const handlePopularClick = (term: string) => {
    saveRecentSearch(term);
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[selectedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted w-full max-w-sm"
        aria-label="Open search command"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search products...</span>
        <kbd className="hidden rounded border bg-background px-1.5 py-0.5 text-xs text-muted-foreground sm:inline-flex items-center gap-0.5">
          <Command className="h-3 w-3" />
          K
        </kbd>
      </button>

      {/* Dialog overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[15vh]"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-xl border bg-background shadow-2xl overflow-hidden"
            >
              {/* Input */}
              <div className="flex items-center border-b px-4">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search products, pages..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 border-0 bg-transparent px-3 py-4 text-base outline-none placeholder:text-muted-foreground"
                  aria-label="Search command input"
                />
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <kbd className="ml-2 rounded border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div
                ref={listRef}
                className="max-h-[40vh] overflow-y-auto"
                role="listbox"
              >
                {results.length > 0 ? (
                  results.map((item, index) => {
                    const Icon = item.icon || File;
                    return (
                      <button
                        key={item.id}
                        role="option"
                        aria-selected={index === selectedIndex}
                        onClick={() => handleSelect(item)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                          index === selectedIndex
                            ? "bg-primary/10 text-primary"
                            : " hover:bg-muted"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            index === selectedIndex
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.label}
                          </p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">
                          {item.type}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No results found
                  </div>
                )}
              </div>

              {/* Footer */}
              {!query && (
                <div className="border-t px-4 py-3">
                  {/* Recent searches */}
                  {recentSearches.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Recent
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            onClick={() => handlePopularClick(term)}
                            className="rounded-full border bg-background px-2.5 py-1 text-xs transition-colors hover:bg-muted"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular */}
                  <div>
                    <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      Popular
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {popularSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => handlePopularClick(term)}
                          className="rounded-full border bg-background px-2.5 py-1 text-xs transition-colors hover:bg-muted"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="flex items-center gap-4 border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
                <span>
                  <kbd className="rounded border bg-background px-1 py-0.5 text-[10px]">↑↓</kbd> Navigate
                </span>
                <span>
                  <kbd className="rounded border bg-background px-1 py-0.5 text-[10px]">↵</kbd> Open
                </span>
                <span>
                  <kbd className="rounded border bg-background px-1 py-0.5 text-[10px]">Esc</kbd> Close
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
