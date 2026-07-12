"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Eye, MoreHorizontal } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { cn, formatPrice, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import { GlassCard } from "@/components/shared/glass-card";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  status: string;
  payment: string;
  total: number;
  items: number;
  date: Date;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_ORDERS: Order[] = [
  { id: "1", orderNumber: "SN-ABC1-2F4K", customer: "Sarah Johnson", email: "sarah@example.com", status: "DELIVERED", payment: "COMPLETED", total: 349.99, items: 3, date: new Date("2026-07-06T14:30:00Z") },
  { id: "2", orderNumber: "SN-ABC2-5B7D", customer: "Michael Chen", email: "michael@example.com", status: "PROCESSING", payment: "COMPLETED", total: 519.98, items: 2, date: new Date("2026-07-06T12:15:00Z") },
  { id: "3", orderNumber: "SN-ABC3-8H1K", customer: "Emily Rodriguez", email: "emily@example.com", status: "SHIPPED", payment: "COMPLETED", total: 189.99, items: 1, date: new Date("2026-07-05T16:45:00Z") },
  { id: "4", orderNumber: "SN-ABC4-3M9P", customer: "David Kim", email: "david@example.com", status: "PENDING", payment: "PENDING", total: 789.50, items: 4, date: new Date("2026-07-05T09:20:00Z") },
  { id: "5", orderNumber: "SN-ABC5-6R2W", customer: "Lisa Thompson", email: "lisa@example.com", status: "CANCELLED", payment: "REFUNDED", total: 124.50, items: 1, date: new Date("2026-07-04T19:00:00Z") },
  { id: "6", orderNumber: "SN-ABC6-9T4X", customer: "James Wilson", email: "james@example.com", status: "DELIVERED", payment: "COMPLETED", total: 1299.99, items: 2, date: new Date("2026-07-04T14:10:00Z") },
  { id: "7", orderNumber: "SN-ABC7-2B8M", customer: "Amanda Foster", email: "amanda@example.com", status: "PROCESSING", payment: "COMPLETED", total: 89.99, items: 1, date: new Date("2026-07-03T11:30:00Z") },
  { id: "8", orderNumber: "SN-ABC8-5H3Q", customer: "Robert Martinez", email: "robert@example.com", status: "SHIPPED", payment: "COMPLETED", total: 459.98, items: 3, date: new Date("2026-07-03T08:45:00Z") },
  { id: "9", orderNumber: "SN-ABC9-8K1W", customer: "Jessica Brown", email: "jessica@example.com", status: "PENDING", payment: "PENDING", total: 234.99, items: 2, date: new Date("2026-07-02T16:20:00Z") },
  { id: "10", orderNumber: "SN-ABC0-1N6P", customer: "Daniel Taylor", email: "daniel@example.com", status: "REFUNDED", payment: "REFUNDED", total: 549.99, items: 1, date: new Date("2026-07-02T10:00:00Z") },
  { id: "11", orderNumber: "SN-ABD1-4R9K", customer: "Olivia White", email: "olivia@example.com", status: "DELIVERED", payment: "COMPLETED", total: 174.50, items: 4, date: new Date("2026-07-01T15:30:00Z") },
  { id: "12", orderNumber: "SN-ABD2-7T2X", customer: "William Garcia", email: "william@example.com", status: "PROCESSING", payment: "COMPLETED", total: 899.99, items: 2, date: new Date("2026-07-01T09:15:00Z") },
];

// ─── Status Styles ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  PROCESSING: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
  SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  REFUNDED: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
};

const PAYMENT_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  REFUNDED: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const filteredOrders = useMemo(() => {
    return MOCK_ORDERS.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (dateFilter === "today") {
        const today = new Date();
        return order.date.toDateString() === today.toDateString();
      }
      if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return order.date >= weekAgo;
      }
      if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return order.date >= monthAgo;
      }
      return true;
    });
  }, [statusFilter, dateFilter]);

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderNumber",
      header: "Order",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-mono font-medium">{row.original.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(row.original.date)}</p>
        </div>
      ),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.customer}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={cn("font-medium", STATUS_STYLES[row.original.status])}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "payment",
      header: "Payment",
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={cn("font-medium", PAYMENT_STYLES[row.original.payment])}
        >
          {row.original.payment}
        </Badge>
      ),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => (
        <div className="text-right">
          <p className="text-sm font-semibold">{formatPrice(row.original.total)}</p>
          <p className="text-xs text-muted-foreground">{row.original.items} items</p>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Actions
            </DropdownMenuLabel>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>Update Status</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Cancel Order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage customer orders ({MOCK_ORDERS.length} orders)
        </p>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredOrders}
          searchable
          searchPlaceholder="Search orders..."
          pageSize={10}
          className="p-0 border-0"
        />
      </GlassCard>
    </motion.div>
  );
}
