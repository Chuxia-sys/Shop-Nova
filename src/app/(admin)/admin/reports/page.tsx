"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Legend,
} from "recharts";

import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GlassCard } from "@/components/shared/glass-card";
import toast from "react-hot-toast";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const revenueReport = [
  { month: "Jan", revenue: 45200, expenses: 27000, profit: 18200 },
  { month: "Feb", revenue: 52800, expenses: 31400, profit: 21400 },
  { month: "Mar", revenue: 61400, expenses: 36300, profit: 25100 },
  { month: "Apr", revenue: 58800, expenses: 35000, profit: 23800 },
  { month: "May", revenue: 72300, expenses: 42700, profit: 29600 },
  { month: "Jun", revenue: 81200, expenses: 48000, profit: 33200 },
  { month: "Jul", revenue: 78400, expenses: 46600, profit: 31800 },
  { month: "Aug", revenue: 89500, expenses: 53000, profit: 36500 },
  { month: "Sep", revenue: 94200, expenses: 55800, profit: 38400 },
  { month: "Oct", revenue: 102300, expenses: 60500, profit: 41800 },
  { month: "Nov", revenue: 115800, expenses: 68600, profit: 47200 },
  { month: "Dec", revenue: 128500, expenses: 76200, profit: 52300 },
];

const salesReportData = [
  { month: "Jan", online: 28500, instore: 16700, total: 45200 },
  { month: "Feb", online: 33200, instore: 19600, total: 52800 },
  { month: "Mar", online: 38900, instore: 22500, total: 61400 },
  { month: "Apr", online: 36700, instore: 22100, total: 58800 },
  { month: "May", online: 45800, instore: 26500, total: 72300 },
  { month: "Jun", online: 52300, instore: 28900, total: 81200 },
  { month: "Jul", online: 49800, instore: 28600, total: 78400 },
  { month: "Aug", online: 57200, instore: 32300, total: 89500 },
  { month: "Sep", online: 60800, instore: 33400, total: 94200 },
  { month: "Oct", online: 66500, instore: 35800, total: 102300 },
  { month: "Nov", online: 75800, instore: 40000, total: 115800 },
  { month: "Dec", online: 84700, instore: 43800, total: 128500 },
];

const topSellingProducts = [
  { name: "Wireless Headphones", units: 1258, revenue: 440298, growth: 12 },
  { name: "Leather Watch", units: 987, revenue: 246741, growth: 8 },
  { name: "Running Shoes", units: 876, revenue: 166431, growth: 15 },
  { name: "Fitness Tracker", units: 745, revenue: 148993, growth: -3 },
  { name: "Skincare Set", units: 654, revenue: 58853, growth: 22 },
];

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function ReportTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-background/95 backdrop-blur-sm p-3 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">
            {entry.name === "Units Sold" ? entry.value.toLocaleString() : formatPrice(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({ from: "2026-01-01", to: "2026-12-31" });
  const [reportTab, setReportTab] = useState("revenue");

  const handleExportCSV = (reportName: string) => {
    toast.success(`${reportName} report exported as CSV`);
  };

  const totalRevenue = revenueReport.reduce((s, r) => s + r.revenue, 0);
  const totalExpenses = revenueReport.reduce((s, r) => s + r.expenses, 0);
  const totalProfit = revenueReport.reduce((s, r) => s + r.profit, 0);
  const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Analyze your store performance
          </p>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <div className="grid gap-1">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, from: e.target.value }))
              }
              className="h-9 w-36"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, to: e.target.value }))
              }
              className="h-9 w-36"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/20">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/20">
              <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold">{formatPrice(totalExpenses)}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/20">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className="text-2xl font-bold">{formatPrice(totalProfit)}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/20">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profit Margin</p>
              <p className="text-2xl font-bold">{profitMargin}%</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Report Tabs */}
      <Tabs value={reportTab} onValueChange={setReportTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="revenue">Revenue Report</TabsTrigger>
            <TabsTrigger value="sales">Sales Report</TabsTrigger>
            <TabsTrigger value="products">Top Products</TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleExportCSV(
                reportTab === "revenue"
                  ? "Revenue"
                  : reportTab === "sales"
                  ? "Sales"
                  : "Products"
              )
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Revenue Report */}
        <TabsContent value="revenue" className="mt-4">
          <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
            <CardHeader>
              <CardTitle>Revenue vs Expenses</CardTitle>
              <CardDescription>
                Monthly breakdown of revenue, expenses, and profit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenueReport}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                    <XAxis
                      dataKey="month"
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
                    <Tooltip content={<ReportTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="expenses"
                      name="Expenses"
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={30}
                      opacity={0.7}
                    />
                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={30}
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      name="Profit"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Report */}
        <TabsContent value="sales" className="mt-4">
          <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
            <CardHeader>
              <CardTitle>Sales Channels</CardTitle>
              <CardDescription>
                Online vs in-store sales comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesReportData}>
                    <defs>
                      <linearGradient id="onlineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="instoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                    <XAxis
                      dataKey="month"
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
                    <Tooltip content={<ReportTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="online"
                      name="Online Sales"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#onlineGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="instore"
                      name="In-Store Sales"
                      stroke="#f97316"
                      strokeWidth={2}
                      fill="url(#instoreGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Products */}
        <TabsContent value="products" className="mt-4">
          <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>
                Best performing products by units sold
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSellingProducts.map((product, i) => (
                  <div
                    key={product.name}
                    className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-accent/30"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                        i === 0
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : i === 1
                          ? "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400"
                          : i === 2
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.units.toLocaleString()} units sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatPrice(product.revenue)}
                      </p>
                      <p
                        className={cn(
                          "text-xs font-medium",
                          product.growth >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {product.growth >= 0 ? "+" : ""}
                        {product.growth}% growth
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
