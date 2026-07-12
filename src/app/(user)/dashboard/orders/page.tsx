"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Search,
  ChevronRight,
  Package,
  Eye,
  Filter,
  SlidersHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatPrice, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ORDER_STATUS_COLORS } from "@/lib/constants";
import type { OrderStatus } from "@/types";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: Date;
  items: OrderItem[];
}

const MOCK_ORDERS: Order[] = [
  {
    id: "1",
    orderNumber: "SN-A1B2-X3C4",
    status: "DELIVERED",
    total: 89.99,
    createdAt: new Date("2026-06-28"),
    items: [
      { id: "1", name: "Wireless Bluetooth Headphones", price: 59.99, quantity: 1, imageUrl: null },
      { id: "2", name: "USB-C Fast Charging Cable", price: 29.99, quantity: 1, imageUrl: null },
    ],
  },
  {
    id: "2",
    orderNumber: "SN-D5E6-F7G8",
    status: "SHIPPED",
    total: 156.50,
    createdAt: new Date("2026-07-01"),
    items: [
      { id: "3", name: "Premium Leather Backpack", price: 129.99, quantity: 1, imageUrl: null },
      { id: "4", name: "Keychain Organizer", price: 26.51, quantity: 2, imageUrl: null },
    ],
  },
  {
    id: "3",
    orderNumber: "SN-H9I0-J1K2",
    status: "PROCESSING",
    total: 45.00,
    createdAt: new Date("2026-07-05"),
    items: [
      { id: "5", name: "Organic Whey Protein Powder", price: 45.00, quantity: 1, imageUrl: null },
    ],
  },
  {
    id: "4",
    orderNumber: "SN-L3M4-N5O6",
    status: "PENDING",
    total: 299.99,
    createdAt: new Date("2026-07-06"),
    items: [
      { id: "6", name: "Smart Watch Pro Series", price: 249.99, quantity: 1, imageUrl: null },
      { id: "7", name: "Silicone Watch Band", price: 24.99, quantity: 2, imageUrl: null },
    ],
  },
  {
    id: "5",
    orderNumber: "SN-P7Q8-R9S0",
    status: "CANCELLED",
    total: 199.99,
    createdAt: new Date("2026-06-15"),
    items: [
      { id: "8", name: "Mechanical Keyboard RGB", price: 199.99, quantity: 1, imageUrl: null },
    ],
  },
  {
    id: "6",
    orderNumber: "SN-T1U2-V3W4",
    status: "DELIVERED",
    total: 520.00,
    createdAt: new Date("2026-06-10"),
    items: [
      { id: "9", name: "4K Monitor 27-inch", price: 449.99, quantity: 1, imageUrl: null },
      { id: "10", name: "HDMI Cable 6ft", price: 70.01, quantity: 1, imageUrl: null },
    ],
  },
];

const STATUS_OPTIONS = [
  { label: "All Orders", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function OrdersPage() {
  const [orders] = useState(MOCK_ORDERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const pageSize = 5;

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
          { label: "Orders" },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
          <p className="mt-1 text-muted-foreground">
            View and track all your orders.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders by number or item..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders list */}
      {paginatedOrders.length > 0 ? (
        <div className="space-y-4">
          {paginatedOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/dashboard/orders/${order.id}`}>
                <Card className="transition-all hover:border-primary/30 hover:shadow-md">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        {/* Order icon */}
                        <div className="hidden h-12 w-12 items-center justify-center rounded-lg bg-primary/10 sm:flex">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{order.orderNumber}</h3>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px]",
                                ORDER_STATUS_COLORS[order.status]
                              )}
                            >
                              {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {order.items.map((item) => item.name).join(", ")}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Placed on {formatDate(order.createdAt)} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                        <p className="text-lg font-bold">{formatPrice(order.total)}</p>
                        <Button variant="ghost" size="sm" className="gap-1 text-primary">
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Details</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredOrders.length}
            onPageChange={setCurrentPage}
            className="pt-4"
          />
        </div>
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              icon={ShoppingBag}
              title={searchQuery || statusFilter !== "all" ? "No matching orders" : "No orders yet"}
              description={
                searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter."
                  : "When you place your first order, it will appear here."
              }
              action={
                searchQuery || statusFilter !== "all"
                  ? {
                      label: "Clear Filters",
                      onClick: () => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      },
                    }
                  : { label: "Start Shopping", onClick: () => window.location.href = "/products" }
              }
            />
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
