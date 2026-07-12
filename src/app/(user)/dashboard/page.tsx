"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Heart,
  Clock,
  TrendingUp,
  ArrowRight,
  Package,
  Star,
  Truck,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatPrice, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { StatsCard } from "@/components/shared/stats-card";
import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuthStore } from "@/store/auth-store";
import { ORDER_STATUS_COLORS } from "@/lib/constants";
import { getInitials } from "@/lib/utils";

// Mock data for demonstration
const MOCK_STATS = {
  totalOrders: 12,
  wishlistCount: 8,
  pendingOrders: 2,
  totalSpent: 1245.80,
};

const MOCK_RECENT_ORDERS = [
  {
    id: "1",
    orderNumber: "SN-A1B2-X3C4",
    status: "DELIVERED" as const,
    total: 89.99,
    createdAt: new Date("2026-06-28"),
    items: [{ name: "Wireless Headphones" }, { name: "USB-C Cable" }],
  },
  {
    id: "2",
    orderNumber: "SN-D5E6-F7G8",
    status: "SHIPPED" as const,
    total: 156.50,
    createdAt: new Date("2026-07-01"),
    items: [{ name: "Designer Backpack" }],
  },
  {
    id: "3",
    orderNumber: "SN-H9I0-J1K2",
    status: "PROCESSING" as const,
    total: 45.00,
    createdAt: new Date("2026-07-05"),
    items: [{ name: "Protein Powder" }, { name: "Shaker Bottle" }],
  },
  {
    id: "4",
    orderNumber: "SN-L3M4-N5O6",
    status: "PENDING" as const,
    total: 299.99,
    createdAt: new Date("2026-07-06"),
    items: [{ name: "Smart Watch" }],
  },
];

const QUICK_ACTIONS = [
  {
    label: "Browse Products",
    href: "/products",
    icon: Package,
    description: "Explore our latest collection",
    color: "from-blue-500 to-cyan-500",
  },
  {
    label: "Track Orders",
    href: "/dashboard/orders",
    icon: Truck,
    description: "View your order status",
    color: "from-purple-500 to-pink-500",
  },
  {
    label: "Wishlist",
    href: "/dashboard/wishlist",
    icon: Heart,
    description: "Items you've saved",
    color: "from-rose-500 to-orange-500",
  },
  {
    label: "Rate Products",
    href: "/dashboard/orders",
    icon: Star,
    description: "Share your feedback",
    color: "from-amber-500 to-yellow-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [recentOrders] = useState(MOCK_RECENT_ORDERS);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome card */}
      <motion.div variants={itemVariants}>
        <GlassCard className="overflow-hidden p-0">
          <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,119,198,0.15),transparent_50%)]" />
            <div className="relative">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 ring-4 ring-white/50 dark:ring-white/10">
                  <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-xl font-bold text-white">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Welcome back, {user?.name?.split(" ")[0] ?? "Guest"}!
                  </h1>
                  <p className="mt-1 text-muted-foreground">
                    Here&apos;s what&apos;s happening with your account today.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Quick stats */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatsCard
          icon={ShoppingBag}
          label="Total Orders"
          value={MOCK_STATS.totalOrders}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          icon={Heart}
          label="Wishlist Items"
          value={MOCK_STATS.wishlistCount}
        />
        <StatsCard
          icon={Clock}
          label="Pending Orders"
          value={MOCK_STATS.pendingOrders}
          trend={{ value: 2, isPositive: false }}
        />
        <StatsCard
          icon={TrendingUp}
          label="Total Spent"
          value={formatPrice(MOCK_STATS.totalSpent)}
          trend={{ value: 8, isPositive: true }}
        />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your latest purchases</CardDescription>
              </div>
              <Link href="/dashboard/orders">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  View All
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="group flex items-center justify-between rounded-lg border border-border/50 p-4 transition-all hover:border-primary/30 hover:bg-accent/30 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <ShoppingBag className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium group-hover:text-primary transition-colors">
                              {order.items.map((i) => i.name).join(", ")}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {order.orderNumber}
                              </span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(order.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {formatPrice(order.total)}
                            </p>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "mt-0.5 text-[10px]",
                                ORDER_STATUS_COLORS[order.status]
                              )}
                            >
                              {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                            </Badge>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ShoppingBag}
                  title="No orders yet"
                  description="When you place your first order, it will appear here."
                  action={{ label: "Start Shopping", onClick: () => window.location.href = "/products" }}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick actions */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Things you can do</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {QUICK_ACTIONS.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="group flex items-center gap-3 rounded-lg border border-border/50 p-3 transition-all hover:border-primary/30 hover:bg-accent/30 hover:shadow-sm"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                          action.color
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">
                          {action.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
