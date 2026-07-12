"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  CreditCard,
  MapPin,
  Package,
  Truck,
  Shield,
  Loader2,
  Building2,
  MapPinned,
  Phone,
  Mail,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SEO } from "@/components/shared/seo";
import { GlassCard } from "@/components/shared/glass-card";
import { useCartStore } from "@/store/cart-store";
import { cn, formatPrice } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import toast from "react-hot-toast";

// Stripe
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

type CheckoutStep = "shipping" | "payment" | "review";

interface ShippingForm {
  fullName: string;
  street: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  saveAddress: boolean;
}

interface PaymentForm {
  method: "stripe" | "cod";
  saveCard: boolean;
}

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
];

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia", "Germany", "France", "Japan"];

function CheckoutForm() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const { items, getSubtotal, getShipping, clearCart } = useCartStore();

  const [step, setStep] = useState<CheckoutStep>("shipping");
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const [shipping, setShipping] = useState<ShippingForm>({
    fullName: "",
    street: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    phone: "",
    email: "",
    saveAddress: false,
  });

  const [payment, setPayment] = useState<PaymentForm>({
    method: "stripe",
    saveCard: false,
  });

  const [shippingErrors, setShippingErrors] = useState<Partial<Record<keyof ShippingForm, string>>>({});

  const subtotal = getSubtotal();
  const shippingFee = getShipping();
  const discount = 0; // No coupon applied at checkout for now
  const total = Math.max(0, subtotal + shippingFee - discount);

  // Create payment intent when reaching payment step
  useEffect(() => {
    if (step === "payment" && payment.method === "stripe" && !clientSecret && stripePromise) {
      const createPaymentIntent = async () => {
        try {
          const res = await fetch("/api/payment/stripe/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: Math.round(total * 100),
              currency: CURRENCY.toLowerCase(),
              metadata: {
                shippingName: shipping.fullName,
                shippingEmail: shipping.email,
              },
            }),
          });
          const data = await res.json();
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            toast.error("Failed to initialize payment");
          }
        } catch {
          toast.error("Payment service unavailable");
        }
      };
      createPaymentIntent();
    }
  }, [step, payment.method, total, shipping, clientSecret]);

  const validateShipping = (): boolean => {
    const errors: Partial<Record<keyof ShippingForm, string>> = {};
    if (!shipping.fullName.trim()) errors.fullName = "Full name is required";
    if (!shipping.street.trim()) errors.street = "Street address is required";
    if (!shipping.city.trim()) errors.city = "City is required";
    if (!shipping.state.trim()) errors.state = "State is required";
    if (!shipping.zipCode.trim()) errors.zipCode = "ZIP code is required";
    if (!shipping.phone.trim()) errors.phone = "Phone number is required";
    if (!shipping.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email))
      errors.email = "Invalid email address";

    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateShipping()) {
      setStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setIsProcessing(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) throw new Error(submitError.message);

      setStep("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!stripe || !elements || !clientSecret) {
      toast.error("Payment not initialized");
      return;
    }

    setIsProcessing(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) throw new Error(submitError.message);

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          payment_method_data: {
            billing_details: {
              name: shipping.fullName,
              email: shipping.email,
              phone: shipping.phone,
              address: {
                line1: shipping.street,
                line2: shipping.apartment,
                city: shipping.city,
                state: shipping.state,
                postal_code: shipping.zipCode,
                country: "US",
              },
            },
          },
        },
        redirect: "if_required",
      });

      if (confirmError) throw new Error(confirmError.message);

      // Payment succeeded - create order
      const orderRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping,
          paymentMethod: "stripe",
          paymentIntentId: clientSecret,
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal,
          shippingFee,
          discount,
          total,
        }),
      });

      const orderData = await orderRes.json();
      if (orderData.success) {
        clearCart();
        toast.success("Order placed successfully! 🎉");
        router.push(`/orders/${orderData.data?.id || ""}`);
      } else {
        throw new Error(orderData.error || "Failed to create order");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { key: "shipping" as const, label: "Shipping", icon: MapPin },
    { key: "payment" as const, label: "Payment", icon: CreditCard },
    { key: "review" as const, label: "Review", icon: Package },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && step !== "shipping") {
      // Don't redirect immediately, allow render
    }
  }, [items.length, step]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Package className="mb-6 h-16 w-16 text-muted-foreground/50" />
        <h2 className="mb-2 text-2xl font-bold">Your cart is empty</h2>
        <p className="mb-8 text-muted-foreground">
          Add some items to your cart before checking out
        </p>
        <Button size="lg" onClick={() => router.push("/products")}>
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main Form */}
      <div className="lg:col-span-2">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                      i < currentStepIndex
                        ? "border-primary bg-primary text-primary-foreground"
                        : i === currentStepIndex
                          ? "border-primary text-primary"
                          : "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {i < currentStepIndex ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <s.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      i <= currentStepIndex
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-4 h-0.5 w-16 sm:w-24",
                      i < currentStepIndex
                        ? "bg-primary"
                        : "bg-muted-foreground/20"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Shipping */}
          {step === "shipping" && (
            <motion.form
              key="shipping"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleShippingSubmit}
            >
              <GlassCard className="p-6">
                <h2 className="mb-6 text-xl font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Shipping Address
                </h2>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="fullName"
                          placeholder="John Doe"
                          value={shipping.fullName}
                          onChange={(e) =>
                            setShipping((prev) => ({ ...prev, fullName: e.target.value }))
                          }
                          className={cn("pl-9", shippingErrors.fullName && "border-destructive")}
                        />
                      </div>
                      {shippingErrors.fullName && (
                        <p className="text-xs text-destructive">{shippingErrors.fullName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={shipping.email}
                          onChange={(e) =>
                            setShipping((prev) => ({ ...prev, email: e.target.value }))
                          }
                          className={cn("pl-9", shippingErrors.email && "border-destructive")}
                        />
                      </div>
                      {shippingErrors.email && (
                        <p className="text-xs text-destructive">{shippingErrors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="street"
                        placeholder="123 Main Street"
                        value={shipping.street}
                        onChange={(e) =>
                          setShipping((prev) => ({ ...prev, street: e.target.value }))
                        }
                        className={cn("pl-9", shippingErrors.street && "border-destructive")}
                      />
                    </div>
                    {shippingErrors.street && (
                      <p className="text-xs text-destructive">{shippingErrors.street}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apartment">Apartment, Suite, etc. (optional)</Label>
                    <Input
                      id="apartment"
                      placeholder="Apt 4B"
                      value={shipping.apartment}
                      onChange={(e) =>
                        setShipping((prev) => ({ ...prev, apartment: e.target.value }))
                      }
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <div className="relative">
                        <MapPinned className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="city"
                          placeholder="New York"
                          value={shipping.city}
                          onChange={(e) =>
                            setShipping((prev) => ({ ...prev, city: e.target.value }))
                          }
                          className={cn("pl-9", shippingErrors.city && "border-destructive")}
                        />
                      </div>
                      {shippingErrors.city && (
                        <p className="text-xs text-destructive">{shippingErrors.city}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Select
                        value={shipping.state}
                        onValueChange={(value) =>
                          setShipping((prev) => ({ ...prev, state: value }))
                        }
                      >
                        <SelectTrigger
                          id="state"
                          className={cn(shippingErrors.state && "border-destructive")}
                        >
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {shippingErrors.state && (
                        <p className="text-xs text-destructive">{shippingErrors.state}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        placeholder="10001"
                        value={shipping.zipCode}
                        onChange={(e) =>
                          setShipping((prev) => ({ ...prev, zipCode: e.target.value }))
                        }
                        className={cn(shippingErrors.zipCode && "border-destructive")}
                      />
                      {shippingErrors.zipCode && (
                        <p className="text-xs text-destructive">{shippingErrors.zipCode}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select
                        value={shipping.country}
                        onValueChange={(value) =>
                          setShipping((prev) => ({ ...prev, country: value }))
                        }
                      >
                        <SelectTrigger id="country">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={shipping.phone}
                          onChange={(e) =>
                            setShipping((prev) => ({ ...prev, phone: e.target.value }))
                          }
                          className={cn("pl-9", shippingErrors.phone && "border-destructive")}
                        />
                      </div>
                      {shippingErrors.phone && (
                        <p className="text-xs text-destructive">{shippingErrors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button type="submit" size="lg" className="gap-2">
                    Continue to Payment
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </GlassCard>
            </motion.form>
          )}

          {/* Step 2: Payment */}
          {step === "payment" && (
            <motion.form
              key="payment"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handlePaymentSubmit}
            >
              <GlassCard className="p-6">
                <h2 className="mb-6 text-xl font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method
                </h2>

                <RadioGroup
                  value={payment.method}
                  onValueChange={(value) =>
                    setPayment((prev) => ({ ...prev, method: value as PaymentForm["method"] }))
                  }
                  className="space-y-3"
                >
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all hover:border-primary/50",
                      payment.method === "stripe"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <RadioGroupItem value="stripe" id="stripe" />
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Credit / Debit Card</p>
                        <p className="text-sm text-muted-foreground">
                          Pay securely with Stripe
                        </p>
                      </div>
                    </div>
                  </label>

                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all hover:border-primary/50",
                      payment.method === "cod"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <RadioGroupItem value="cod" id="cod" />
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Cash on Delivery</p>
                        <p className="text-sm text-muted-foreground">
                          Pay when you receive
                        </p>
                      </div>
                    </div>
                  </label>
                </RadioGroup>

                {/* Stripe Elements */}
                {payment.method === "stripe" && clientSecret && stripe && (
                  <div className="mt-6 rounded-xl border p-4">
                    <PaymentElement
                      options={{
                        layout: "tabs",
                        defaultValues: {
                          billingDetails: {
                            name: shipping.fullName,
                            email: shipping.email,
                            phone: shipping.phone,
                          },
                        },
                      }}
                    />
                  </div>
                )}

                {payment.method === "stripe" && !clientSecret && (
                  <div className="mt-6 flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setStep("shipping")}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Shipping
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="gap-2"
                    disabled={isProcessing || (payment.method === "stripe" && !clientSecret)}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Continue to Review
                  </Button>
                </div>
              </GlassCard>
            </motion.form>
          )}

          {/* Step 3: Review */}
          {step === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-6">
                <h2 className="mb-6 text-xl font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Order Review
                </h2>

                {/* Shipping Address */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Shipping To
                    </h3>
                    <button
                      onClick={() => setStep("shipping")}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="mt-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{shipping.fullName}</p>
                    <p>{shipping.street}{shipping.apartment ? `, ${shipping.apartment}` : ""}</p>
                    <p>{shipping.city}, {shipping.state} {shipping.zipCode}</p>
                    <p>{shipping.country}</p>
                    <p className="mt-1">{shipping.phone}</p>
                    <p>{shipping.email}</p>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      Payment Method
                    </h3>
                    <button
                      onClick={() => setStep("payment")}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="mt-2 rounded-lg bg-muted/50 p-3 text-sm">
                    {payment.method === "stripe" ? (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <span>Credit / Debit Card</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span>Cash on Delivery</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold">Items ({items.length})</h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg bg-muted/30 p-3"
                      >
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          {item.variantName && (
                            <p className="text-xs text-muted-foreground">{item.variantName}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setStep("payment")}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Payment
                  </Button>
                  <Button
                    size="lg"
                    className="gap-2 min-w-[180px]"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5" />
                        Place Order
                      </>
                    )}
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Order Summary Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <GlassCard className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Order Summary</h3>
            <div className="space-y-4">
              <div className="max-h-60 space-y-3 overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-green-600 dark:text-green-400">Free</span>
                    ) : (
                      formatPrice(shippingFee)
                    )}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 flex-shrink-0 text-green-500" />
                <span>Your payment is secure with SSL encryption</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { getSubtotal, getShipping } = useCartStore();
  const subtotal = getSubtotal();
  const shippingFee = getShipping();
  const total = Math.max(0, subtotal + shippingFee);

  const options: StripeElementsOptions = useMemo(
    () => ({
      mode: "payment",
      amount: Math.round(total * 100),
      currency: CURRENCY.toLowerCase(),
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "hsl(221.2, 83.2%, 53.3%)",
          colorBackground: "hsl(0, 0%, 100%)",
          colorText: "hsl(222.2, 84%, 4.9%)",
          colorDanger: "hsl(0, 84.2%, 60.2%)",
          fontFamily: "Inter, system-ui, sans-serif",
          borderRadius: "8px",
        },
      },
    }),
    [total]
  );

  return (
    <>
      <SEO
        title="Checkout"
        description="Complete your purchase securely"
        path="/checkout"
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4 py-6">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: "Cart", href: "/cart" },
              { label: "Checkout" },
            ]}
            className="mb-6"
          />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Checkout
            </h1>
            <p className="mt-2 text-muted-foreground">
              Complete your purchase securely
            </p>
          </motion.div>

          {stripePromise ? (
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm />
            </Elements>
          ) : (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground">Payment system is not configured. Please contact support.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
