"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  ShoppingCart,
  Tag,
  Loader2,
  AlertCircle,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SEO } from "@/components/shared/seo";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import { useCartStore } from "@/store/cart-store";
import { cn, formatPrice } from "@/lib/utils";
import {
  CURRENCY,
  SHIPPING_FEE,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/constants";
import toast from "react-hot-toast";

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getShipping,
    getTotal,
  } = useCartStore();

  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const discount = couponDiscount;
  const total = Math.max(0, getTotal() - discount);

  const freeShippingProgress = Math.min(
    100,
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100
  );

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    setIsApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/checkout/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCouponDiscount(data.data.discount || 0);
        toast.success("Coupon applied successfully!");
      } else {
        setCouponError(data.error || "Invalid coupon code");
        toast.error("Invalid coupon code");
      }
    } catch {
      setCouponError("Failed to apply coupon. Please try again.");
      toast.error("Failed to apply coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  return (
    <>
      <SEO
        title="Shopping Cart"
        description="Review your cart items and proceed to checkout"
        path="/cart"
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4 py-6">
          {/* Breadcrumbs */}
          <Breadcrumbs items={[{ label: "Cart" }]} className="mb-6" />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Shopping Cart
              </h1>
              <p className="mt-2 text-muted-foreground">
                {items.length} item{items.length !== 1 ? "s" : ""} in your cart
              </p>
            </div>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearCart();
                  toast.success("Cart cleared");
                }}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Cart
              </Button>
            )}
          </motion.div>

          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <EmptyState
                icon={ShoppingBag}
                title="Your cart is empty"
                description="Looks like you haven't added anything to your cart yet. Start shopping to find great deals!"
                action={{
                  label: "Start Shopping",
                  onClick: () => router.push("/products"),
                }}
              />
            </motion.div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {/* Free shipping progress */}
                {freeShippingProgress < 100 && (
                  <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm">
                          {subtotal < FREE_SHIPPING_THRESHOLD ? (
                            <>
                              Add{" "}
                              <span className="font-semibold text-primary">
                                {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)}
                              </span>{" "}
                              more for free shipping!
                            </>
                          ) : (
                            "You've earned free shipping! 🎉"
                          )}
                        </p>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                            style={{ width: `${Math.min(100, freeShippingProgress)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}

                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.3 }}
                      layout
                    >
                      <GlassCard className="p-4">
                        <div className="flex gap-4 sm:gap-6">
                          {/* Product Image */}
                          <Link
                            href={`/products/${item.slug}`}
                            className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-28"
                          >
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="112px"
                            />
                          </Link>

                          {/* Item Details */}
                          <div className="flex flex-1 flex-col justify-between">
                            <div className="flex justify-between">
                              <div>
                                <Link
                                  href={`/products/${item.slug}`}
                                  className="font-medium transition-colors hover:text-primary line-clamp-1"
                                >
                                  {item.name}
                                </Link>
                                {item.variantName && (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {item.variantName}
                                  </p>
                                )}
                                <p className="mt-1 text-sm font-semibold">
                                  {formatPrice(item.price)}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  removeItem(item.productId, item.variantId);
                                  toast.success("Item removed from cart");
                                }}
                                className="flex-shrink-0 p-1 text-muted-foreground transition-colors hover:text-destructive"
                                aria-label="Remove item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between">
                              {/* Quantity Controls */}
                              <div className="flex items-center rounded-lg border">
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.productId,
                                      item.quantity - 1,
                                      item.variantId
                                    )
                                  }
                                  disabled={item.quantity <= 1}
                                  className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-accent disabled:opacity-50"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="flex h-8 w-10 items-center justify-center text-sm font-medium tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.productId,
                                      item.quantity + 1,
                                      item.variantId
                                    )
                                  }
                                  disabled={item.quantity >= item.maxQuantity}
                                  className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-accent disabled:opacity-50"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>

                              {/* Item Total */}
                              <p className="text-sm font-bold">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Continue Shopping */}
                <div className="pt-2">
                  <Button
                    variant="link"
                    onClick={() => router.push("/products")}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Continue Shopping
                  </Button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-4">
                  <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold">Order Summary</h3>
                    <Separator className="my-4" />

                    {/* Coupon Code */}
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-medium">
                        Coupon Code
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter coupon"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value);
                            setCouponError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleApplyCoupon();
                          }}
                          className={cn(couponError && "border-destructive")}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleApplyCoupon}
                          disabled={isApplyingCoupon}
                        >
                          {isApplyingCoupon ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      </div>
                      {couponError && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          {couponError}
                        </p>
                      )}
                      {couponDiscount > 0 && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <Tag className="h-3 w-3" />
                          Coupon applied! -{formatPrice(couponDiscount)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>
                          {shipping === 0 ? (
                            <span className="text-green-600 dark:text-green-400">
                              Free
                            </span>
                          ) : (
                            formatPrice(shipping)
                          )}
                        </span>
                      </div>
                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>Discount</span>
                          <span>-{formatPrice(couponDiscount)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-base font-bold">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Including taxes where applicable
                      </p>
                    </div>

                    <Button
                      size="lg"
                      className="mt-6 w-full gap-2"
                      onClick={() => router.push("/checkout")}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Proceed to Checkout
                    </Button>

                    {/* Payment methods */}
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <div className="text-xs text-muted-foreground">
                        We accept:
                      </div>
                      <div className="flex gap-2">
                        <span className="inline-flex h-6 items-center rounded border px-2 text-xs font-medium">
                          Visa
                        </span>
                        <span className="inline-flex h-6 items-center rounded border px-2 text-xs font-medium">
                          MC
                        </span>
                        <span className="inline-flex h-6 items-center rounded border px-2 text-xs font-medium">
                          Amex
                        </span>
                        <span className="inline-flex h-6 items-center rounded border px-2 text-xs font-medium">
                          PP
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}


