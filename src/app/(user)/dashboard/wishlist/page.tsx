"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Eye,
  Star,
  StarHalf,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/hooks/use-toast";

interface WishlistItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  rating: number;
  reviewCount: number;
  image: string;
  inStock: boolean;
  addedAt: Date;
}

const MOCK_WISHLIST: WishlistItem[] = [
  {
    id: "1",
    name: "Wireless Bluetooth Headphones",
    slug: "wireless-bluetooth-headphones",
    price: 59.99,
    compareAtPrice: 89.99,
    rating: 4.5,
    reviewCount: 128,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
    inStock: true,
    addedAt: new Date("2026-07-01"),
  },
  {
    id: "2",
    name: "Premium Leather Backpack",
    slug: "premium-leather-backpack",
    price: 129.99,
    compareAtPrice: null,
    rating: 4.8,
    reviewCount: 89,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
    inStock: true,
    addedAt: new Date("2026-06-28"),
  },
  {
    id: "3",
    name: "Smart Watch Pro Series",
    slug: "smart-watch-pro-series",
    price: 249.99,
    compareAtPrice: 299.99,
    rating: 4.3,
    reviewCount: 256,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
    inStock: true,
    addedAt: new Date("2026-06-25"),
  },
  {
    id: "4",
    name: "Minimalist Desk Lamp",
    slug: "minimalist-desk-lamp",
    price: 45.00,
    compareAtPrice: null,
    rating: 4.1,
    reviewCount: 42,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&q=80",
    inStock: false,
    addedAt: new Date("2026-06-20"),
  },
  {
    id: "5",
    name: "Organic Cotton T-Shirt",
    slug: "organic-cotton-t-shirt",
    price: 34.99,
    compareAtPrice: 49.99,
    rating: 4.6,
    reviewCount: 67,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
    inStock: true,
    addedAt: new Date("2026-06-18"),
  },
  {
    id: "6",
    name: "Ceramic Coffee Mug Set",
    slug: "ceramic-coffee-mug-set",
    price: 29.99,
    compareAtPrice: null,
    rating: 4.9,
    reviewCount: 34,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80",
    inStock: true,
    addedAt: new Date("2026-06-15"),
  },
];

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < fullStars) {
          return <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />;
        }
        if (i === fullStars && hasHalf) {
          return <StarHalf key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />;
        }
        return <Star key={i} className="h-3.5 w-3.5 text-muted-foreground/30" />;
      })}
    </div>
  );
}

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>(MOCK_WISHLIST);

  function removeFromWishlist(id: string) {
    setWishlist((prev) => prev.filter((item) => item.id !== id));
    toast.success("Removed from wishlist");
  }

  function addToCart(item: WishlistItem) {
    toast.success("Added to cart", `${item.name} has been added to your cart.`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Wishlist" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Wishlist</h1>
          <p className="mt-1 text-muted-foreground">
            {wishlist.length} item{wishlist.length !== 1 ? "s" : ""} saved
          </p>
        </div>
      </div>

      {/* Wishlist grid */}
      {wishlist.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {wishlist.map((item, index) => {
              const discount = calculateDiscount(item.price, item.compareAtPrice);
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group overflow-hidden transition-all hover:shadow-lg">
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      {/* Overlay actions */}
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Link href={`/products/${item.slug}`}>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-10 w-10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-10 w-10"
                          onClick={() => addToCart(item)}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-10 w-10 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove from Wishlist?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {item.name} from your wishlist?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeFromWishlist(item.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Badges */}
                      <div className="absolute left-3 top-3 flex flex-col gap-1">
                        {discount && (
                          <Badge variant="default" className="bg-destructive text-destructive-foreground">
                            -{discount}%
                          </Badge>
                        )}
                        {!item.inStock && (
                          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                            Out of Stock
                          </Badge>
                        )}
                      </div>

                      {/* Heart icon top right */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-3 top-3 h-8 w-8 rounded-full bg-background/60 backdrop-blur-sm hover:bg-background/80"
                      >
                        <Heart className="h-4 w-4 fill-destructive text-destructive" />
                      </Button>
                    </div>

                    {/* Content */}
                    <CardContent className="p-4">
                      <Link href={`/products/${item.slug}`}>
                        <h3 className="text-sm font-medium transition-colors hover:text-primary line-clamp-1">
                          {item.name}
                        </h3>
                      </Link>

                      <div className="mt-1 flex items-center gap-2">
                        <StarRating rating={item.rating} />
                        <span className="text-xs text-muted-foreground">
                          ({item.reviewCount})
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-lg font-bold">
                          {formatPrice(item.price)}
                        </span>
                        {item.compareAtPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(item.compareAtPrice)}
                          </span>
                        )}
                      </div>

                      <Button
                        className="mt-3 w-full gap-2"
                        size="sm"
                        disabled={!item.inStock}
                        onClick={() => addToCart(item)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {item.inStock ? "Add to Cart" : "Out of Stock"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              icon={Heart}
              title="Your wishlist is empty"
              description="Start saving items you love to your wishlist!"
              action={{ label: "Browse Products", onClick: () => window.location.href = "/products" }}
            />
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
