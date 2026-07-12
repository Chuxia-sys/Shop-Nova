"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Heart,
  Share2,
  Check,
  Minus,
  Plus,
  Truck,
  Shield,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Star,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ProductGrid } from "@/components/shared/product-grid";
import { ReviewCard } from "@/components/shared/review-card";
import { Rating } from "@/components/shared/rating";
import { SEO } from "@/components/shared/seo";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { GlassCard } from "@/components/shared/glass-card";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { cn, formatPrice, calculateDiscount, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ProductWithRelations } from "@/types";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<ProductWithRelations | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyNow, setIsBuyNow] = useState(false);

  const addToCart = useCartStore((s) => s.addItem);
  const { isInWishlist, toggleItem } = useWishlistStore();
  const cartItems = useCartStore((s) => s.items);
  const openCart = useCartStore((s) => s.openCart);

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${slug}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Product not found");
        throw new Error("Failed to load product");
      }
      const data = await res.json();
      const productData = data.data || data;
      setProduct(productData);

      // Fetch related products from same category
      if (productData.category?.id) {
        try {
          const relRes = await fetch(
            `/api/products?category=${productData.category.slug}&limit=4`
          );
          if (relRes.ok) {
            const relData = await relRes.json();
            const related = (relData.data || relData).filter(
              (p: ProductWithRelations) => p.id !== productData.id
            );
            setRelatedProducts(related.slice(0, 4));
          }
        } catch {
          // Non-critical
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Reset quantity when product changes
  useEffect(() => {
    setQuantity(1);
    setSelectedImage(0);
    setSelectedVariant(null);
  }, [slug]);

  const images = product?.images?.length
    ? product.images.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
    : [];

  const discount = product
    ? calculateDiscount(product.price, product.compareAtPrice)
    : null;

  const averageRating = product?.reviews?.length
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;

  const inWishlist = product ? isInWishlist(product.id) : false;

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAddingToCart(true);

    try {
      addToCart({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        image: images[0]?.url || "/placeholder.svg",
        quantity,
        variantId: selectedVariant || undefined,
        variantName: selectedVariant
          ? product.variants?.find((v) => v.id === selectedVariant)?.name
          : undefined,
        maxQuantity: product.quantity,
      });
      toast.success("Added to cart!", {
        icon: "🛒",
      });
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setIsBuyNow(true);
    try {
      addToCart({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        image: images[0]?.url || "/placeholder.svg",
        quantity,
        variantId: selectedVariant || undefined,
        variantName: selectedVariant
          ? product.variants?.find((v) => v.id === selectedVariant)?.name
          : undefined,
        maxQuantity: product.quantity,
      });
      openCart();
      setTimeout(() => {
        router.push("/checkout");
      }, 300);
    } catch {
      toast.error("Failed to process");
    } finally {
      setIsBuyNow(false);
    }
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      image: images[0]?.url || "/placeholder.svg",
    });
    toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist");
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4 py-8">
          <LoadingState text="Loading product..." size="lg" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4 py-8">
          <ErrorState
            title="Product not found"
            description={error || "The product you're looking for doesn't exist"}
            onRetry={() => router.push("/products")}
            retryLabel="Browse Products"
          />
        </div>
      </div>
    );
  }

  const cartItem = cartItems.find((i) => i.productId === product.id);

  return (
    <>
      <SEO
        title={product.name}
        description={product.excerpt || product.description}
        image={images[0]?.url}
        path={`/products/${product.slug}`}
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4 py-6">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: "Products", href: "/products" },
              ...(product.category
                ? [{ label: product.category.name, href: `/products?category=${product.category.slug}` }
              ]: []),
              { label: product.name },
            ]}
            className="mb-6"
          />

          {/* Product Main Section */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <GlassCard className="relative aspect-square overflow-hidden p-0">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    src={images[selectedImage]?.url || "/placeholder.svg"}
                    alt={images[selectedImage]?.altText || product.name}
                    className="h-full w-full object-cover"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>

                {/* Navigation arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setSelectedImage((prev) =>
                          prev === 0 ? images.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 backdrop-blur-sm transition-colors hover:bg-white dark:bg-gray-900/80 dark:hover:bg-gray-900"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImage((prev) =>
                          prev === images.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 backdrop-blur-sm transition-colors hover:bg-white dark:bg-gray-900/80 dark:hover:bg-gray-900"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Discount badge */}
                {discount && (
                  <Badge
                    variant="destructive"
                    className="absolute left-4 top-4 px-3 py-1 text-sm"
                  >
                    -{discount}% OFF
                  </Badge>
                )}
              </GlassCard>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(index)}
                      className={cn(
                        "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                        selectedImage === index
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border opacity-70 hover:opacity-100"
                      )}
                    >
                      <img
                        src={image.url}
                        alt={image.altText || `${product.name} ${index + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6"
            >
              {/* Category & Brand */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {product.category && (
                  <span>{product.category.name}</span>
                )}
                {product.brand && (
                  <>
                    <span>·</span>
                    <span>{product.brand.name}</span>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <Rating rating={averageRating} size="default" />
                <span className="text-sm text-muted-foreground">
                  {averageRating.toFixed(1)} ({product.reviews.length}{" "}
                  review{product.reviews.length !== 1 ? "s" : ""})
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold">
                  {formatPrice(product.price)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
                {discount && (
                  <Badge variant="destructive" className="text-xs">
                    Save {discount}%
                  </Badge>
                )}
              </div>

              {/* Description */}
              <p className="leading-relaxed text-muted-foreground">
                {product.description}
              </p>

              {/* SKU */}
              <p className="text-xs text-muted-foreground">
                SKU: {product.sku}
              </p>

              <Separator />

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold">
                    {product.variants[0]?.name || "Options"}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant.id)}
                        disabled={variant.quantity === 0}
                        className={cn(
                          "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                          selectedVariant === variant.id
                            ? "border-primary bg-primary/10 text-primary"
                            : variant.quantity === 0
                              ? "cursor-not-allowed border-destructive/30 text-destructive/50 line-through"
                              : "border-border hover:border-primary/50 hover:bg-accent"
                        )}
                      >
                        {variant.options as string}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <h3 className="mb-3 text-sm font-semibold">Quantity</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-lg border">
                    <button
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      disabled={quantity <= 1}
                      className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-accent disabled:opacity-50"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="flex h-10 w-12 items-center justify-center text-sm font-medium tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((prev) => Math.min(product.quantity, prev + 1))
                      }
                      disabled={quantity >= product.quantity}
                      className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-accent disabled:opacity-50"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {product.quantity <= 5 && product.quantity > 0 && (
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      Only {product.quantity} left in stock
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="flex-1 min-w-[180px] gap-2"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || product.quantity === 0}
                >
                  {isAddingToCart ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-5 w-5" />
                  )}
                  {product.quantity === 0 ? "Out of Stock" : "Add to Cart"}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="flex-1 min-w-[140px] gap-2"
                  onClick={handleBuyNow}
                  disabled={isBuyNow || product.quantity === 0}
                >
                  {isBuyNow ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-5 w-5" />
                  )}
                  Buy Now
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleToggleWishlist}
                  className={cn(
                    "h-10 w-10",
                    inWishlist && "border-red-200 text-red-500 dark:border-red-800"
                  )}
                >
                  <Heart
                    className={cn(
                      "h-5 w-5",
                      inWishlist && "fill-red-500"
                    )}
                  />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleShare}
                  className="h-10 w-10"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Cart quantity indicator */}
              {cartItem && cartItem.quantity > 0 && (
                <p className="text-sm text-muted-foreground">
                  You have {cartItem.quantity} in your cart
                </p>
              )}

              {/* Shipping info */}
              <GlassCard className="p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Free Shipping</p>
                      <p className="text-xs text-muted-foreground">
                        On orders over $100
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Secure Checkout</p>
                      <p className="text-xs text-muted-foreground">
                        SSL encrypted
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RotateCcw className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">30-Day Returns</p>
                      <p className="text-xs text-muted-foreground">
                        Easy returns
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Tabs Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12"
          >
            <Tabs defaultValue="reviews" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="reviews"
                  className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary"
                >
                  Reviews ({product.reviews.length})
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="shipping"
                  className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary"
                >
                  Shipping
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reviews" className="pt-6">
                {product.reviews.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Star className="mb-4 h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mb-2 text-lg font-semibold">No reviews yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Be the first to review this product
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {product.reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="pt-6">
                <div className="max-w-prose">
                  <h3 className="mb-4 text-lg font-semibold">Product Details</h3>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>{product.description}</p>
                    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <dt className="text-xs text-muted-foreground">SKU</dt>
                        <dd className="text-sm font-medium">{product.sku}</dd>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <dt className="text-xs text-muted-foreground">Category</dt>
                        <dd className="text-sm font-medium">
                          {product.category?.name || "N/A"}
                        </dd>
                      </div>
                      {product.brand && (
                        <div className="rounded-lg bg-muted/50 p-3">
                          <dt className="text-xs text-muted-foreground">Brand</dt>
                          <dd className="text-sm font-medium">{product.brand.name}</dd>
                        </div>
                      )}
                      <div className="rounded-lg bg-muted/50 p-3">
                        <dt className="text-xs text-muted-foreground">Stock</dt>
                        <dd className="text-sm font-medium">
                          {product.quantity > 0
                            ? `${product.quantity} units`
                            : "Out of stock"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="shipping" className="pt-6">
                <div className="max-w-prose space-y-4 text-muted-foreground leading-relaxed">
                  <h3 className="text-lg font-semibold text-foreground">
                    Shipping Information
                  </h3>
                  <p>
                    We offer free standard shipping on all orders over $100.
                    Orders are typically processed within 1-2 business days.
                  </p>
                  <ul className="list-inside list-disc space-y-2">
                    <li>Standard Shipping (5-7 business days) - $9.99</li>
                    <li>Express Shipping (2-3 business days) - $19.99</li>
                    <li>Free Shipping on orders over $100</li>
                    <li>International shipping available</li>
                  </ul>
                  <h3 className="text-lg font-semibold text-foreground pt-4">
                    Return Policy
                  </h3>
                  <p>
                    We offer a 30-day return policy for most items. Products
                    must be unused and in their original packaging.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-16"
            >
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Related Products</h2>
                  <p className="mt-1 text-muted-foreground">
                    You might also like these
                  </p>
                </div>
                <Button variant="outline" onClick={() => router.push("/products")}>
                  View All
                </Button>
              </div>
              <ProductGrid products={relatedProducts} />
            </motion.section>
          )}
        </div>
      </div>
    </>
  );
}
