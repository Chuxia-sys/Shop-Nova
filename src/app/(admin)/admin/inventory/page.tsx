"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, AlertTriangle, Package } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import { GlassCard } from "@/components/shared/glass-card";
import { StatsCard } from "@/components/shared/stats-card";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  image: string;
  quantity: number;
  reserved: number;
  lowStockThreshold: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_INVENTORY: InventoryItem[] = [
  { id: "1", name: "Wireless Noise-Cancelling Headphones", sku: "ELC-HDPH-0001", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80", quantity: 145, reserved: 12, lowStockThreshold: 20 },
  { id: "2", name: "Minimalist Leather Watch", sku: "FAS-WTCH-0002", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80", quantity: 89, reserved: 5, lowStockThreshold: 15 },
  { id: "3", name: "Premium Running Shoes", sku: "FAS-SHOS-0003", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80", quantity: 234, reserved: 18, lowStockThreshold: 30 },
  { id: "4", name: "Smart Fitness Tracker", sku: "ELC-FTRK-0004", image: "https://images.unsplash.com/photo-1557431177-36141475c676?w=200&q=80", quantity: 8, reserved: 3, lowStockThreshold: 15 },
  { id: "5", name: "Organic Skincare Set", sku: "BEA-SKCR-0005", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200&q=80", quantity: 312, reserved: 25, lowStockThreshold: 40 },
  { id: "6", name: "Ergonomic Office Chair", sku: "HOM-CHR-0006", image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=200&q=80", quantity: 5, reserved: 2, lowStockThreshold: 10 },
  { id: "7", name: "Portable Bluetooth Speaker", sku: "ELC-SPKR-0007", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=200&q=80", quantity: 178, reserved: 14, lowStockThreshold: 25 },
  { id: "8", name: "Cashmere Blend Sweater", sku: "FAS-SWTR-0008", image: "https://images.unsplash.com/photo-1434389677669-e08b4cda3a4d?w=200&q=80", quantity: 3, reserved: 1, lowStockThreshold: 10 },
  { id: "9", name: "Stainless Steel Water Bottle", sku: "HOM-BTTL-0009", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=200&q=80", quantity: 567, reserved: 42, lowStockThreshold: 50 },
  { id: "10", name: "Scented Candle Collection", sku: "HOM-CNDL-0010", image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=200&q=80", quantity: 234, reserved: 20, lowStockThreshold: 30 },
  { id: "11", name: "Yoga Mat Premium", sku: "SPO-YGAM-0011", image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=200&q=80", quantity: 123, reserved: 10, lowStockThreshold: 20 },
  { id: "12", name: "Designer Sunglasses", sku: "FAS-SNGL-0012", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&q=80", quantity: 12, reserved: 4, lowStockThreshold: 15 },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [inventory, setInventory] = useState(MOCK_INVENTORY);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustType, setAdjustType] = useState<"add" | "remove" | "set">("add");
  const [stockFilter, setStockFilter] = useState("all");

  const totalItems = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const lowStockCount = inventory.filter(
    (i) => i.quantity <= i.lowStockThreshold
  ).length;
  const outOfStockCount = inventory.filter((i) => i.quantity === 0).length;

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (stockFilter === "low") return item.quantity <= item.lowStockThreshold && item.quantity > 0;
      if (stockFilter === "out") return item.quantity === 0;
      return true;
    });
  }, [inventory, stockFilter]);

  const openAdjustDialog = (item: InventoryItem) => {
    setAdjustItem(item);
    setAdjustQuantity(0);
    setAdjustType("add");
    setAdjustDialogOpen(true);
  };

  const handleAdjustStock = () => {
    if (!adjustItem) return;

    let newQuantity = adjustItem.quantity;
    if (adjustType === "add") newQuantity += adjustQuantity;
    else if (adjustType === "remove") newQuantity = Math.max(0, newQuantity - adjustQuantity);
    else newQuantity = Math.max(0, adjustQuantity);

    setInventory((prev) =>
      prev.map((i) =>
        i.id === adjustItem.id ? { ...i, quantity: newQuantity } : i
      )
    );

    toast.success(
      `Stock updated: ${adjustItem.name} now has ${newQuantity} units`
    );
    setAdjustDialogOpen(false);
  };

  const columns: ColumnDef<InventoryItem>[] = [
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            <img
              src={row.original.image}
              alt={row.original.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium max-w-[250px]">
              {row.original.name}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.sku}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: "On Hand",
      cell: ({ row }) => {
        const item = row.original;
        const isLow = item.quantity <= item.lowStockThreshold;
        return (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-semibold",
                isLow ? "text-destructive" : ""
              )}
            >
              {item.quantity}
            </span>
            {isLow && (
              <Badge
                variant="destructive"
                className="text-[10px] px-1.5 py-0"
              >
                Low Stock
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "reserved",
      header: "Reserved",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.reserved}
        </span>
      ),
    },
    {
      id: "available",
      header: "Available",
      cell: ({ row }) => {
        const available = row.original.quantity - row.original.reserved;
        return (
          <span
            className={cn(
              "text-sm font-medium",
              available <= 0 ? "text-destructive" : ""
            )}
          >
            {available}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openAdjustDialog(row.original)}
        >
          Adjust Stock
        </Button>
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
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage product stock levels
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard
          icon={Package}
          label="Total Items"
          value={totalItems.toLocaleString()}
          className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10"
        />
        <StatsCard
          icon={Package}
          label="Unique Products"
          value={inventory.length}
          className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10"
        />
        <StatsCard
          icon={AlertTriangle}
          label="Low Stock"
          value={lowStockCount}
          trend={lowStockCount > 0 ? { value: lowStockCount, isPositive: false } : undefined}
          className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10"
        />
        <StatsCard
          icon={AlertTriangle}
          label="Out of Stock"
          value={outOfStockCount}
          trend={outOfStockCount > 0 ? { value: outOfStockCount, isPositive: false } : undefined}
          className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10"
        />
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="All Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredInventory}
          searchable
          searchPlaceholder="Search inventory..."
          pageSize={10}
          className="p-0 border-0"
        />
      </GlassCard>

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              {adjustItem?.name} — Current stock:{" "}
              <span className="font-semibold">{adjustItem?.quantity}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Action</Label>
              <Select
                value={adjustType}
                onValueChange={(v) => setAdjustType(v as "add" | "remove" | "set")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Stock</SelectItem>
                  <SelectItem value="remove">Remove Stock</SelectItem>
                  <SelectItem value="set">Set to Exact Quantity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>
                {adjustType === "set" ? "New Quantity" : "Quantity"}
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={adjustQuantity}
                onChange={(e) =>
                  setAdjustQuantity(parseInt(e.target.value) || 0)
                }
              />
            </div>

            {adjustType !== "set" && adjustItem && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="text-muted-foreground">
                  Resulting stock:{" "}
                  <span className="font-semibold text-foreground">
                    {adjustType === "add"
                      ? adjustItem.quantity + adjustQuantity
                      : Math.max(0, adjustItem.quantity - adjustQuantity)}
                  </span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustStock}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
