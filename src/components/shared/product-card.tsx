"use client";

import { memo, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn, formatPrice, calculateDiscount } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/shared/rating";
import { ShoppingCart, Heart, Eye } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useProductPrefetch } from "@/hooks/use-prefetch";
import type { ProductWithRelations } from "@/types";

interface ProductCardProps {
  product: ProductWithRelations;
  className?: string;
}

export const ProductCard = memo(function ProductCard({ product, className }: ProductCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const addToCart = useCartStore((s) => s.addItem);
  const { isInWishlist, toggleItem } = useWishlistStore();
  const prefetchProduct = useProductPrefetch();

  const primaryImage = product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url;
  const secondaryImage = product.images?.find((img) => !img.isPrimary)?.url;
  const discount = calculateDiscount(product.price, product.compareAtPrice);
  const productReviews = product.reviews ?? [];
  const averageRating =
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const addToCart = useCartStore((s) => s.addItem);
  const { isInWishlist, toggleItem } = useWishlistStore();

  const primaryImage = product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url;
  const secondaryImage = product.images?.find((img) => !img.isPrimary)?.url;
  const discount = calculateDiscount(product.price, product.compareAtPrice);
  const productReviews = product.reviews ?? [];
  const averageRating =
    product.averageRating ??
    (productReviews.length > 0
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
      : 0);
  const reviewCount = product.reviewCount ?? product._count?.reviews ?? productReviews.length;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      image: primaryImage || "/placeholder.svg",
      quantity: 1,
      maxQuantity: product.quantity,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      image: primaryImage || "/placeholder.svg",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href={`/products/${product.slug}`}
        className="group block"
        onMouseEnter={() => prefetchProduct(product.slug)}
        onFocus={() => prefetchProduct(product.slug)}
      >
        <Card
          className={cn(
            "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
            className
          )}
        >
          {/* Image container */}
          <div className="relative aspect-square overflow-hidden bg-muted">
            {!isImageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-muted" />
            )}
            <img
              src={primaryImage || "/placeholder.svg"}
              alt={product.name}
              className={cn(
                "h-full w-full object-cover transition-all duration-500 group-hover:scale-110",
                isImageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setIsImageLoaded(true)}
              loading="lazy"
            />
            {secondaryImage && (
              <img
                src={secondaryImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                loading="lazy"
                aria-hidden
              />
            )}

            {/* Discount badge */}
            {discount && (
              <Badge
                variant="destructive"
                className="absolute left-3 top-3 px-2 py-0.5 text-xs font-bold"
              >
                -{discount}%
              </Badge>
            )}

            {/* Wishlist button */}
            <button
              onClick={handleToggleWishlist}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors hover:bg-white dark:bg-gray-900/80 dark:hover:bg-gray-900"
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors",
                  inWishlist
                    ? "fill-red-500 text-red-500"
                    : "text-gray-600 dark:text-gray-300"
                )}
              />
            </button>

            {/* Quick actions */}
            <div className="absolute bottom-0 left-0 right-0 flex translate-y-full items-center justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full bg-white text-gray-900 hover:bg-gray-100"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-1.5 h-4 w-4" />
                Add to Cart
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full bg-white text-gray-900 hover:bg-gray-100"
                asChild
              >
                <span>
                  <Eye className="h-4 w-4" />
                </span>
              </Button>
            </div>
          </div>

          {/* Product info */}
          <div className="space-y-1.5 p-4">
            <p className="text-xs text-muted-foreground">
              {product.category.name}
            </p>
            <h3 className="line-clamp-1 text-sm font-medium group-hover:text-primary">
              {product.name}
            </h3>
            <div className="flex items-center gap-2">
              <Rating rating={averageRating} size="sm" />
              <span className="text-xs text-muted-foreground">
                ({reviewCount})
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-base font-bold">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
});
