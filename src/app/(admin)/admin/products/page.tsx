"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Copy, MoreHorizontal, Eye, Search } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { cn, formatPrice, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { DataTable } from "@/components/shared/data-table";
import { GlassCard } from "@/components/shared/glass-card";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  isActive: boolean;
  category: string;
  image: string;
  createdAt: Date;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Wireless Noise-Cancelling Headphones", slug: "wireless-headphones", sku: "ELC-HDPH-0001", price: 349.99, compareAtPrice: 399.99, quantity: 145, isActive: true, category: "Electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80", createdAt: new Date("2026-01-15") },
  { id: "2", name: "Minimalist Leather Watch", slug: "leather-watch", sku: "FAS-WTCH-0002", price: 249.99, compareAtPrice: null, quantity: 89, isActive: true, category: "Fashion", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80", createdAt: new Date("2026-02-10") },
  { id: "3", name: "Premium Running Shoes", slug: "running-shoes", sku: "FAS-SHOS-0003", price: 189.99, compareAtPrice: 229.99, quantity: 234, isActive: true, category: "Fashion", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80", createdAt: new Date("2026-03-05") },
  { id: "4", name: "Smart Fitness Tracker", slug: "fitness-tracker", sku: "ELC-FTRK-0004", price: 199.99, compareAtPrice: 249.99, quantity: 67, isActive: true, category: "Electronics", image: "https://images.unsplash.com/photo-1557431177-36141475c676?w=200&q=80", createdAt: new Date("2026-03-20") },
  { id: "5", name: "Organic Skincare Set", slug: "skincare-set", sku: "BEA-SKCR-0005", price: 89.99, compareAtPrice: null, quantity: 312, isActive: true, category: "Beauty", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200&q=80", createdAt: new Date("2026-04-01") },
  { id: "6", name: "Ergonomic Office Chair", slug: "ergonomic-chair", sku: "HOM-CHR-0006", price: 599.99, compareAtPrice: 749.99, quantity: 23, isActive: true, category: "Home & Living", image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=200&q=80", createdAt: new Date("2026-04-15") },
  { id: "7", name: "Portable Bluetooth Speaker", slug: "bluetooth-speaker", sku: "ELC-SPKR-0007", price: 129.99, compareAtPrice: 159.99, quantity: 178, isActive: true, category: "Electronics", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=200&q=80", createdAt: new Date("2026-05-01") },
  { id: "8", name: "Cashmere Blend Sweater", slug: "cashmere-sweater", sku: "FAS-SWTR-0008", price: 159.99, compareAtPrice: 199.99, quantity: 45, isActive: false, category: "Fashion", image: "https://images.unsplash.com/photo-1434389677669-e08b4cda3a4d?w=200&q=80", createdAt: new Date("2026-05-10") },
  { id: "9", name: "Stainless Steel Water Bottle", slug: "water-bottle", sku: "HOM-BTTL-0009", price: 34.99, compareAtPrice: null, quantity: 567, isActive: true, category: "Home & Living", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=200&q=80", createdAt: new Date("2026-05-20") },
  { id: "10", name: "Scented Candle Collection", slug: "candle-collection", sku: "HOM-CNDL-0010", price: 49.99, compareAtPrice: 64.99, quantity: 234, isActive: true, category: "Home & Living", image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=200&q=80", createdAt: new Date("2026-06-01") },
  { id: "11", name: "Yoga Mat Premium", slug: "yoga-mat", sku: "SPO-YGAM-0011", price: 79.99, compareAtPrice: null, quantity: 123, isActive: true, category: "Sports", image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=200&q=80", createdAt: new Date("2026-06-10") },
  { id: "12", name: "Designer Sunglasses", slug: "designer-sunglasses", sku: "FAS-SNGL-0012", price: 299.99, compareAtPrice: 399.99, quantity: 56, isActive: true, category: "Fashion", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&q=80", createdAt: new Date("2026-06-15") },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (statusFilter === "active" && !p.isActive) return false;
      if (statusFilter === "inactive" && p.isActive) return false;
      return true;
    });
  }, [products, categoryFilter, statusFilter]);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))],
    [products]
  );

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Product deleted successfully");
  };

  const handleBulkDelete = () => {
    setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
    toast.success(`${selectedIds.length} products deleted`);
    setSelectedIds([]);
  };

  const handleBulkStatus = (active: boolean) => {
    setProducts((prev) =>
      prev.map((p) =>
        selectedIds.includes(p.id) ? { ...p, isActive: active } : p
      )
    );
    toast.success(`${selectedIds.length} products updated`);
    setSelectedIds([]);
  };

  const columns: ColumnDef<Product>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    },
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
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-normal">
          {row.original.category}
        </Badge>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (
        <div className="text-sm">
          <span className="font-medium">{formatPrice(row.original.price)}</span>
          {row.original.compareAtPrice && (
            <span className="ml-1.5 text-xs text-muted-foreground line-through">
              {formatPrice(row.original.compareAtPrice)}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Stock",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{row.original.quantity}</span>
          {row.original.quantity <= 50 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Low
            </Badge>
          )}
        </div>
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
            <DropdownMenuItem asChild>
              <Link href={`/admin/products/${row.original.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product catalog ({products.length} products)
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Bulk actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">
                {selectedIds.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatus(true)}
              >
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatus(false)}
              >
                Deactivate
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Products</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedIds.length} products?
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Data Table */}
      <GlassCard className="p-0 overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredProducts}
          searchable
          searchPlaceholder="Search products..."
          pageSize={10}
          className="p-0 border-0"
        />
      </GlassCard>
    </motion.div>
  );
}
