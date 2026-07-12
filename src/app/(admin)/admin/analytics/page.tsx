"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { cn, formatPrice, formatDate, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GlassCard } from "@/components/shared/glass-card";
import { getInitials } from "@/lib/utils";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const revenueData = [
  { month: "Jan", revenue: 45200, orders: 342, profit: 18200 },
  { month: "Feb", revenue: 52800, orders: 401, profit: 21400 },
  { month: "Mar", revenue: 61400, orders: 478, profit: 25100 },
  { month: "Apr", revenue: 58800, orders: 445, profit: 23800 },
  { month: "May", revenue: 72300, orders: 523, profit: 29600 },
  { month: "Jun", revenue: 81200, orders: 589, profit: 33200 },
  { month: "Jul", revenue: 78400, orders: 567, profit: 31800 },
  { month: "Aug", revenue: 89500, orders: 634, profit: 36500 },
  { month: "Sep", revenue: 94200, orders: 678, profit: 38400 },
  { month: "Oct", revenue: 102300, orders: 712, profit: 41800 },
  { month: "Nov", revenue: 115800, orders: 789, profit: 47200 },
  { month: "Dec", revenue: 128500, orders: 856, profit: 52300 },
];

const salesByCategory = [
  { name: "Electronics", value: 35, color: "#6366f1" },
  { name: "Fashion", value: 25, color: "#8b5cf6" },
  { name: "Home & Living", value: 18, color: "#ec4899" },
  { name: "Beauty", value: 12, color: "#f43f5e" },
  { name: "Sports", value: 10, color: "#f97316" },
];

const topProducts = [
  { id: "1", name: "Wireless Noise-Cancelling Headphones", slug: "wireless-headphones", price: 349.99, totalSold: 1258, totalRevenue: 440298, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80" },
  { id: "2", name: "Minimalist Leather Watch", slug: "leather-watch", price: 249.99, totalSold: 987, totalRevenue: 246741, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80" },
  { id: "3", name: "Premium Running Shoes", slug: "running-shoes", price: 189.99, totalSold: 876, totalRevenue: 166431, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80" },
  { id: "4", name: "Smart Fitness Tracker", slug: "fitness-tracker", price: 199.99, totalSold: 745, totalRevenue: 148993, image: "https://images.unsplash.com/photo-1557431177-36141475c676?w=200&q=80" },
  { id: "5", name: "Organic Skincare Set", slug: "skincare-set", price: 89.99, totalSold: 654, totalRevenue: 58853, image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200&q=80" },
];

const recentOrders = [
  { id: "1", orderNumber: "SN-ABC1-2F4K", customer: { name: "Sarah Johnson", email: "sarah@example.com", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80" }, status: "DELIVERED", payment: "COMPLETED", total: 349.99, date: "2026-07-06T14:30:00Z", items: 3 },
  { id: "2", orderNumber: "SN-ABC2-5B7D", customer: { name: "Michael Chen", email: "michael@example.com", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80" }, status: "PROCESSING", payment: "COMPLETED", total: 519.98, date: "2026-07-06T12:15:00Z", items: 2 },
  { id: "3", orderNumber: "SN-ABC3-8H1K", customer: { name: "Emily Rodriguez", email: "emily@example.com", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80" }, status: "SHIPPED", payment: "COMPLETED", total: 189.99, date: "2026-07-05T16:45:00Z", items: 1 },
  { id: "4", orderNumber: "SN-ABC4-3M9P", customer: { name: "David Kim", email: "david@example.com", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80" }, status: "PENDING", payment: "PENDING", total: 789.50, date: "2026-07-05T09:20:00Z", items: 4 },
  { id: "5", orderNumber: "SN-ABC5-6R2W", customer: { name: "Lisa Thompson", email: "lisa@example.com", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80" }, status: "CANCELLED", payment: "REFUNDED", total: 124.50, date: "2026-07-04T19:00:00Z", items: 1 },
];

const dailyRevenue = [
  { day: "Mon", revenue: 3200 },
  { day: "Tue", revenue: 4100 },
  { day: "Wed", revenue: 3800 },
  { day: "Thu", revenue: 5200 },
  { day: "Fri", revenue: 4800 },
  { day: "Sat", revenue: 6100 },
  { day: "Sun", revenue: 3900 },
];

// ─── Colors ──────────────────────────────────────────────────────────────────

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316"];

const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  PROCESSING: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
  SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  REFUNDED: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
};

// ─── Components ──────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  subtitle,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
}) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
              trend.isPositive
                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </GlassCard>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-background/95 backdrop-blur-sm p-3 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">
            {entry.name === "Revenue" || entry.name === "Profit"
              ? formatPrice(entry.value)
              : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="rounded-xl border bg-background/95 backdrop-blur-sm p-3 shadow-lg">
      <div className="flex items-center gap-2 text-sm">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: data.color }} />
        <span className="font-medium">{data.name}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        {data.value}% of sales
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [revenuePeriod, setRevenuePeriod] = useState<"weekly" | "monthly">("monthly");

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = revenueData.reduce((sum, d) => sum + d.orders, 0);
  const totalCustomers = 25478;
  const totalProducts = 1234;

  const statsCards = useMemo(
    () => [
      {
        icon: DollarSign,
        label: "Total Revenue",
        value: formatPrice(totalRevenue),
        trend: { value: 12.5, isPositive: true },
        subtitle: `+${formatPrice(revenueData[revenueData.length - 1].revenue - revenueData[revenueData.length - 2].revenue)} from last month`,
      },
      {
        icon: ShoppingBag,
        label: "Total Orders",
        value: totalOrders.toLocaleString(),
        trend: { value: 8.2, isPositive: true },
        subtitle: `${revenueData[revenueData.length - 1].orders} this month`,
      },
      {
        icon: Users,
        label: "Total Customers",
        value: totalCustomers.toLocaleString(),
        trend: { value: 3.1, isPositive: true },
        subtitle: "1,245 new this month",
      },
      {
        icon: Package,
        label: "Total Products",
        value: totalProducts.toLocaleString(),
        trend: { value: 2.4, isPositive: true },
        subtitle: "48 new this month",
      },
    ],
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Your store performance at a glance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue & profit trends</CardDescription>
            </div>
            <Tabs value={revenuePeriod} onValueChange={(v) => setRevenuePeriod(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="weekly" className="text-xs px-3">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-3">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenuePeriod === "monthly" ? revenueData : dailyRevenue}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                  <XAxis
                    dataKey={revenuePeriod === "monthly" ? "month" : "day"}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                  {revenuePeriod === "monthly" && (
                    <Line
                      type="monotone"
                      dataKey="profit"
                      name="Profit"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Revenue distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {salesByCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {salesByCategory.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: cat.color }}
                    />
                    <span className="text-muted-foreground">{cat.name}</span>
                  </div>
                  <span className="font-medium">{cat.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Top Products + Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best selling products this month</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              <Eye className="h-3.5 w-3.5" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, i) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent/30"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.totalSold.toLocaleString()} sold
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatPrice(product.totalRevenue)}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(product.price)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders across your store</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              <Eye className="h-3.5 w-3.5" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent/30"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={order.customer.image} alt={order.customer.name} />
                    <AvatarFallback className="text-xs">
                      {getInitials(order.customer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{order.customer.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-1.5 py-0 font-medium",
                          ORDER_STATUS_STYLES[order.status]
                        )}
                      >
                        {order.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(order.date)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
                    <p className="text-xs text-muted-foreground">{order.items} items</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
