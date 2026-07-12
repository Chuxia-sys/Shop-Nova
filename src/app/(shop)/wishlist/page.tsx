"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowLeft,
  HeartOff,
  Loader2,
  Share2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SEO } from "@/components/shared/seo";
import { EmptyState } from "@/components/shared/empty-state";
import { Rating } from "@/components/shared/rating";
import { GlassCard } from "@/components/shared/glass-card";
import { useWishlistStore } from "@/store/wishlist-store";
import { useCartStore } from "@/store/cart-store";
import { cn, formatPrice, calculateDiscount } from "@/lib/utils";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const router = useRouter();
  const { items, removeItem, clearWishlist, getCount } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addItem);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const count = getCount();

  const handleAddToCart = (item: (typeof items)[0]) => {
    setAddingToCart(item.productId);
    // Simulate API call
    setTimeout(() => {
      addToCart({
        productId: item.productId,
        name: item.name,
        slug: item.slug,
        price: item.price,
        compareAtPrice: item.compareAtPrice,
        image: item.image || "/placeholder.svg",
        quantity: 1,
        maxQuantity: 99,
      });
      setAddingToCart(null);
      toast.success(`${item.name} added to cart`);
    }, 400);
  };

  const handleRemoveItem = (productId: string, name: string) => {
    removeItem(productId);
    toast.success(`${name} removed from wishlist`);
  };

  const handleShareWishlist = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Wishlist",
          text: `Check out my wishlist with ${count} items!`,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Wishlist link copied!");
    }
  };

  return (
    <>
      <SEO
        title="My Wishlist"
        description="View and manage your saved items"
        path="/wishlist"
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4 py-6">
          {/* Breadcrumbs */}
          <Breadcrumbs items={[{ label: "Wishlist" }]} className="mb-6" />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex flex-wrap items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                My Wishlist
              </h1>
              <p className="mt-2 text-muted-foreground">
                {count === 0
                  ? "Your wishlist is empty"
                  : `${count} saved item${count !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {count > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareWishlist}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      clearWishlist();
                      toast.success("Wishlist cleared");
                    }}
                    className="text-muted-foreground hover:text-destructive gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>
                </>
              )}
            </div>
          </motion.div>

          {count === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <EmptyState
                icon={HeartOff}
                title="Your wishlist is empty"
                description="Save your favorite items to your wishlist and come back to them later!"
                action={{
                  label: "Browse Products",
                  onClick: () => router.push("/products"),
                }}
              />
            </motion.div>
          ) : (
            <>
              {/* View toggle info */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 text-sm text-muted-foreground"
              >
                <Heart className="mr-1 inline-block h-4 w-4" />
                Items in your wishlist are saved for later. Add them to your
                cart when you&apos;re ready to purchase.
              </motion.p>

              {/* Wishlist Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <AnimatePresence>
                  {items.map((item, index) => {
                    const discount = calculateDiscount(
                      item.price,
                      item.compareAtPrice
                    );

                    return (
                      <motion.div
                        key={item.productId}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
                          {/* Image */}
                          <Link
                            href={`/products/${item.slug}`}
                            className="relative block aspect-square overflow-hidden bg-muted"
                          >
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />

                            {/* Discount badge */}
                            {discount && (
                              <Badge
                                variant="destructive"
                                className="absolute left-3 top-3 px-2 py-0.5 text-xs font-bold"
                              >
                                -{discount}%
                              </Badge>
                            )}
                          </Link>

                          {/* Product Info */}
                          <div className="space-y-2 p-4">
                            <Link href={`/products/${item.slug}`}>
                              <h3 className="line-clamp-1 text-sm font-medium transition-colors hover:text-primary">
                                {item.name}
                              </h3>
                            </Link>

                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold">
                                {formatPrice(item.price)}
                              </span>
                              {item.compareAtPrice && (
                                <span className="text-sm text-muted-foreground line-through">
                                  {formatPrice(item.compareAtPrice)}
                                </span>
                              )}
                            </div>

                            <Separator />

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-1">
                              <Button
                                size="sm"
                                className="flex-1 gap-1.5"
                                onClick={() => handleAddToCart(item)}
                                disabled={addingToCart === item.productId}
                              >
                                {addingToCart === item.productId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ShoppingCart className="h-4 w-4" />
                                )}
                                Add to Cart
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() =>
                                  handleRemoveItem(item.productId, item.name)
                                }
                                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                aria-label={`Remove ${item.name} from wishlist`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Floating heart indicator */}
                          <div className="absolute right-3 top-3">
                            <Heart className="h-5 w-5 fill-red-500 text-red-500 drop-shadow-sm" />
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Bottom actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-10 flex flex-col items-center gap-4"
              >
                <p className="text-sm text-muted-foreground">
                  Not ready to buy? Your items will stay here until you decide.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/products")}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Continue Shopping
                  </Button>
                  {count > 0 && (
                    <Button
                      onClick={() => {
                        // Add all items to cart
                        items.forEach((item) => {
                          addToCart({
                            productId: item.productId,
                            name: item.name,
                            slug: item.slug,
                            price: item.price,
                            compareAtPrice: item.compareAtPrice,
                            image: item.image || "/placeholder.svg",
                            quantity: 1,
                            maxQuantity: 99,
                          });
                        });
                        toast.success(`Added ${count} item${count !== 1 ? "s" : ""} to cart!`);
                      }}
                      className="gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add All to Cart
                    </Button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
