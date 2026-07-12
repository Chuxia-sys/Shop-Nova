"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Package,
  MapPin,
  CreditCard,
  Truck,
  ChevronRight,
  ArrowLeft,
  Download,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { GlassCard } from "@/components/shared/glass-card";
import { ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";

// Mock data
const MOCK_ORDER = {
  id: "1",
  orderNumber: "SN-A1B2-X3C4",
  status: "SHIPPED" as const,
  paymentStatus: "COMPLETED" as const,
  subtotal: 79.99,
  shippingFee: 9.99,
  taxAmount: 0,
  discountAmount: 0,
  total: 89.98,
  currency: "USD",
  notes: "Leave at front door if no answer.",
  trackingNumber: "1Z999AA10123456784",
  shippingCarrier: "UPS",
  estimatedDelivery: new Date("2026-07-12"),
  deliveredAt: null,
  cancelledAt: null,
  createdAt: new Date("2026-07-05"),
  updatedAt: new Date("2026-07-06"),
  address: {
    fullName: "John Doe",
    street: "123 Main Street",
    apartment: "Apt 4B",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "United States",
    phone: "+1 (555) 123-4567",
  },
  items: [
    {
      id: "1",
      name: "Wireless Bluetooth Headphones",
      sku: "ELE-WBH-0001",
      price: 49.99,
      quantity: 1,
      total: 49.99,
      imageUrl: null,
      productId: "p1",
    },
    {
      id: "2",
      name: "USB-C Fast Charging Cable 6ft",
      sku: "ELE-UCC-0002",
      price: 29.99,
      quantity: 1,
      total: 29.99,
      imageUrl: null,
      productId: "p2",
    },
  ],
  payment: {
    id: "pay_1",
    amount: 89.98,
    currency: "USD",
    status: "COMPLETED" as const,
    receiptUrl: "#",
    createdAt: new Date("2026-07-05"),
  },
};

const STATUS_TIMELINE = [
  { status: "PENDING", label: "Order Placed", date: new Date("2026-07-05T10:30:00"), completed: true },
  { status: "CONFIRMED", label: "Order Confirmed", date: new Date("2026-07-05T10:35:00"), completed: true },
  { status: "PROCESSING", label: "Processing", date: new Date("2026-07-05T14:00:00"), completed: true },
  { status: "SHIPPED", label: "Shipped", date: new Date("2026-07-06T09:00:00"), completed: true },
  { status: "DELIVERED", label: "Delivered", date: null, completed: false },
];

function StatusTimeline() {
  return (
    <div className="space-y-0">
      {STATUS_TIMELINE.map((step, index) => {
        const isLast = index === STATUS_TIMELINE.length - 1;
        return (
          <div key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2",
                  step.completed
                    ? "border-primary bg-primary text-white"
                    : "border-muted-foreground/30 bg-background text-muted-foreground"
                )}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "h-full w-0.5",
                    step.completed ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
            <div className={cn("pb-8", isLast && "pb-0")}>
              <p
                className={cn(
                  "text-sm font-medium",
                  step.completed ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
              {step.date && (
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(step.date)}
                </p>
              )}
              {isLast && !step.completed && (
                <p className="text-xs text-muted-foreground">Estimated: Jul 12, 2026</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order] = useState(MOCK_ORDER);
  const [isCancelling, setIsCancelling] = useState(false);

  const canCancel = ["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status);

  async function handleCancelOrder() {
    setIsCancelling(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Order cancelled", "Your order has been cancelled successfully.");
      router.push("/dashboard/orders");
    } catch {
      toast.error("Failed to cancel", "Please try again later.");
    } finally {
      setIsCancelling(false);
    }
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
          { label: "Orders", href: "/dashboard/orders" },
          { label: order.orderNumber },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Order {order.orderNumber}
            </h1>
            <Badge
              variant="secondary"
              className={cn(ORDER_STATUS_COLORS[order.status])}
            >
              {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            Placed on {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          {order.payment?.receiptUrl && (
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Receipt
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Order items & timeline */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatPrice(item.total)}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{order.shippingFee > 0 ? formatPrice(order.shippingFee) : "FREE"}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline />
            </CardContent>
          </Card>

          {/* Cancel order */}
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Cancel Order
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this order? This action cannot be undone.
                    A refund will be processed within 5-7 business days.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Order</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      "Yes, Cancel Order"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Right column - Shipping & Payment info */}
        <div className="space-y-6">
          {/* Shipping info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{order.address.fullName}</p>
              <p>{order.address.street}</p>
              {order.address.apartment && <p>{order.address.apartment}</p>}
              <p>
                {order.address.city}, {order.address.state} {order.address.zipCode}
              </p>
              <p>{order.address.country}</p>
              <div className="flex items-center gap-2 pt-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{order.address.phone}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tracking info */}
          {order.trackingNumber && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4 text-primary" />
                  Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Carrier</span>
                  <span className="font-medium">{order.shippingCarrier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tracking #</span>
                  <span className="font-medium">{order.trackingNumber}</span>
                </div>
                {order.estimatedDelivery && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Est. Delivery</span>
                    <span className="font-medium">
                      {formatDateTime(order.estimatedDelivery)}
                    </span>
                  </div>
                )}
                <Button variant="outline" size="sm" className="mt-2 w-full gap-2">
                  <Truck className="h-3.5 w-3.5" />
                  Track Package
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Payment info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">Visa ending in 4242</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{formatPrice(order.payment.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant="secondary"
                  className={cn("text-[10px]", PAYMENT_STATUS_COLORS[order.payment.status])}
                >
                  {order.payment.status.charAt(0) + order.payment.status.slice(1).toLowerCase()}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{formatDateTime(order.payment.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4 text-primary" />
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
