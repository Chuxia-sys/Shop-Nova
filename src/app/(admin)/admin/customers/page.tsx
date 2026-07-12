"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, Mail, Eye, Ban } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { cn, formatPrice, formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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

interface Customer {
  id: string;
  name: string;
  email: string;
  image: string | null;
  orders: number;
  totalSpent: number;
  joinedDate: Date;
  isActive: boolean;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_CUSTOMERS: Customer[] = [
  { id: "1", name: "Sarah Johnson", email: "sarah@example.com", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80", orders: 12, totalSpent: 4589.75, joinedDate: new Date("2025-03-15"), isActive: true },
  { id: "2", name: "Michael Chen", email: "michael@example.com", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80", orders: 8, totalSpent: 2198.50, joinedDate: new Date("2025-04-20"), isActive: true },
  { id: "3", name: "Emily Rodriguez", email: "emily@example.com", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80", orders: 15, totalSpent: 6789.00, joinedDate: new Date("2025-01-10"), isActive: true },
  { id: "4", name: "David Kim", email: "david@example.com", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80", orders: 5, totalSpent: 1245.99, joinedDate: new Date("2025-06-05"), isActive: true },
  { id: "5", name: "Lisa Thompson", email: "lisa@example.com", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80", orders: 3, totalSpent: 450.50, joinedDate: new Date("2025-08-12"), isActive: false },
  { id: "6", name: "James Wilson", email: "james@example.com", image: null, orders: 20, totalSpent: 12590.00, joinedDate: new Date("2024-11-01"), isActive: true },
  { id: "7", name: "Amanda Foster", email: "amanda@example.com", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80", orders: 7, totalSpent: 3890.25, joinedDate: new Date("2025-02-18"), isActive: true },
  { id: "8", name: "Robert Martinez", email: "robert@example.com", image: null, orders: 1, totalSpent: 89.99, joinedDate: new Date("2026-07-01"), isActive: true },
  { id: "9", name: "Jessica Brown", email: "jessica@example.com", image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200&q=80", orders: 10, totalSpent: 3450.00, joinedDate: new Date("2025-05-22"), isActive: true },
  { id: "10", name: "Daniel Taylor", email: "daniel@example.com", image: null, orders: 4, totalSpent: 1899.99, joinedDate: new Date("2025-09-14"), isActive: false },
  { id: "11", name: "Olivia White", email: "olivia@example.com", image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80", orders: 18, totalSpent: 7890.00, joinedDate: new Date("2024-12-03"), isActive: true },
  { id: "12", name: "William Garcia", email: "william@example.com", image: null, orders: 6, totalSpent: 2100.00, joinedDate: new Date("2025-07-19"), isActive: true },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredCustomers = useMemo(() => {
    return MOCK_CUSTOMERS.filter((c) => {
      if (statusFilter === "active" && !c.isActive) return false;
      if (statusFilter === "inactive" && c.isActive) return false;
      return true;
    });
  }, [statusFilter]);

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={row.original.image ?? undefined} alt={row.original.name} />
            <AvatarFallback className="text-xs">
              {getInitials(row.original.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "orders",
      header: "Orders",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.orders}</span>
      ),
    },
    {
      accessorKey: "totalSpent",
      header: "Total Spent",
      cell: ({ row }) => (
        <span className="text-sm font-semibold">
          {formatPrice(row.original.totalSpent)}
        </span>
      ),
    },
    {
      accessorKey: "joinedDate",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.joinedDate)}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.isActive ? "default" : "secondary"}
          className={cn(
            "font-normal",
            row.original.isActive
              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : ""
          )}
        >
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
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
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Ban className="mr-2 h-4 w-4" />
              {row.original.isActive ? "Deactivate" : "Activate"}
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
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your customers ({MOCK_CUSTOMERS.length} customers)
        </p>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredCustomers}
          searchable
          searchPlaceholder="Search customers..."
          pageSize={10}
          className="p-0 border-0"
        />
      </GlassCard>
    </motion.div>
  );
}
