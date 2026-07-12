"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, MoreHorizontal, Copy } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { cn, formatPrice, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/shared/data-table";
import { GlassCard } from "@/components/shared/glass-card";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Coupon {
  id: string;
  code: string;
  discount: string;
  type: "percentage" | "fixed";
  value: number;
  minOrder: number;
  usageCount: number;
  usageLimit: number | null;
  expiryDate: Date | null;
  isActive: boolean;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_COUPONS: Coupon[] = [
  { id: "1", code: "WELCOME10", discount: "10% off", type: "percentage", value: 10, minOrder: 0, usageCount: 845, usageLimit: 1000, expiryDate: new Date("2026-12-31"), isActive: true },
  { id: "2", code: "SUMMER25", discount: "25% off", type: "percentage", value: 25, minOrder: 50, usageCount: 234, usageLimit: 500, expiryDate: new Date("2026-09-30"), isActive: true },
  { id: "3", code: "FLAT50", discount: "$50 off", type: "fixed", value: 50, minOrder: 200, usageCount: 67, usageLimit: 200, expiryDate: new Date("2026-08-31"), isActive: true },
  { id: "4", code: "FREESHIP", discount: "Free shipping", type: "fixed", value: 0, minOrder: 100, usageCount: 456, usageLimit: null, expiryDate: null, isActive: true },
  { id: "5", code: "VIP20", discount: "20% off", type: "percentage", value: 20, minOrder: 150, usageCount: 89, usageLimit: 300, expiryDate: new Date("2027-01-01"), isActive: true },
  { id: "6", code: "BLACKFRIDAY", discount: "40% off", type: "percentage", value: 40, minOrder: 0, usageCount: 1234, usageLimit: 2000, expiryDate: new Date("2026-11-30"), isActive: false },
  { id: "7", code: "NEWUSER", discount: "15% off", type: "percentage", value: 15, minOrder: 0, usageCount: 567, usageLimit: null, expiryDate: new Date("2026-12-31"), isActive: true },
  { id: "8", code: "CLEARANCE", discount: "30% off", type: "percentage", value: 30, minOrder: 0, usageCount: 12, usageLimit: 100, expiryDate: new Date("2026-07-31"), isActive: true },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CouponsPage() {
  const [coupons, setCoupons] = useState(MOCK_COUPONS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<"percentage" | "fixed">("percentage");
  const [formValue, setFormValue] = useState(0);
  const [formMinOrder, setFormMinOrder] = useState(0);
  const [formUsageLimit, setFormUsageLimit] = useState<number | null>(null);
  const [formExpiry, setFormExpiry] = useState("");
  const [formActive, setFormActive] = useState(true);

  const openCreate = () => {
    setEditingCoupon(null);
    setFormCode("");
    setFormType("percentage");
    setFormValue(0);
    setFormMinOrder(0);
    setFormUsageLimit(null);
    setFormExpiry("");
    setFormActive(true);
    setSheetOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormType(coupon.type);
    setFormValue(coupon.value);
    setFormMinOrder(coupon.minOrder);
    setFormUsageLimit(coupon.usageLimit);
    setFormExpiry(coupon.expiryDate ? coupon.expiryDate.toISOString().split("T")[0] : "");
    setFormActive(coupon.isActive);
    setSheetOpen(true);
  };

  const handleSubmit = () => {
    if (!formCode.trim() || formValue <= 0) {
      toast.error("Code and discount value are required");
      return;
    }

    const discount =
      formType === "percentage"
        ? `${formValue}% off`
        : formValue === 0
        ? "Free shipping"
        : `$${formValue} off`;

    if (editingCoupon) {
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === editingCoupon.id
            ? {
                ...c,
                code: formCode.trim().toUpperCase(),
                discount,
                type: formType,
                value: formValue,
                minOrder: formMinOrder,
                usageLimit: formUsageLimit,
                expiryDate: formExpiry ? new Date(formExpiry) : null,
                isActive: formActive,
              }
            : c
        )
      );
      toast.success("Coupon updated");
    } else {
      const newCoupon: Coupon = {
        id: `coup-${Date.now()}`,
        code: formCode.trim().toUpperCase(),
        discount,
        type: formType,
        value: formValue,
        minOrder: formMinOrder,
        usageCount: 0,
        usageLimit: formUsageLimit,
        expiryDate: formExpiry ? new Date(formExpiry) : null,
        isActive: formActive,
      };
      setCoupons((prev) => [...prev, newCoupon]);
      toast.success("Coupon created");
    }

    setSheetOpen(false);
  };

  const handleDelete = (id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    toast.success("Coupon deleted");
    setDeleteId(null);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const columns: ColumnDef<Coupon>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold tracking-wider">
            {row.original.code}
          </span>
          <button
            onClick={() => handleCopyCode(row.original.code)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
    {
      accessorKey: "discount",
      header: "Discount",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.discount}</span>
      ),
    },
    {
      accessorKey: "usageCount",
      header: "Used",
      cell: ({ row }) => (
        <div className="text-sm">
          <span className="font-medium">{row.original.usageCount.toLocaleString()}</span>
          {row.original.usageLimit && (
            <span className="text-muted-foreground">
              {" "}/ {row.original.usageLimit.toLocaleString()}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "minOrder",
      header: "Min. Order",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.minOrder > 0 ? formatPrice(row.original.minOrder) : "None"}
        </span>
      ),
    },
    {
      accessorKey: "expiryDate",
      header: "Expiry",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.expiryDate ? formatDate(row.original.expiryDate) : "Never"}
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
            <DropdownMenuItem onClick={() => openEdit(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopyCode(row.original.code)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Code
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteId(row.original.id)}
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
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage discount coupons
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Coupon
        </Button>
      </div>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        <DataTable
          columns={columns}
          data={coupons}
          searchable
          searchPlaceholder="Search coupons..."
          pageSize={10}
          className="p-0 border-0"
        />
      </GlassCard>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {editingCoupon ? "Edit Coupon" : "Create Coupon"}
            </SheetTitle>
            <SheetDescription>
              {editingCoupon
                ? "Update the coupon details below."
                : "Configure a new discount coupon."}
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="coup-code">Coupon Code</Label>
              <Input
                id="coup-code"
                placeholder="SUMMER20"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="coup-type">Discount Type</Label>
                <Select
                  value={formType}
                  onValueChange={(v) => setFormType(v as "percentage" | "fixed")}
                >
                  <SelectTrigger id="coup-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="coup-value">
                  {formType === "percentage" ? "Percentage (%)" : "Amount ($)"}
                </Label>
                <Input
                  id="coup-value"
                  type="number"
                  min="0"
                  placeholder={formType === "percentage" ? "10" : "25"}
                  value={formValue}
                  onChange={(e) => setFormValue(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="coup-min">Minimum Order Amount ($)</Label>
              <Input
                id="coup-min"
                type="number"
                min="0"
                placeholder="0"
                value={formMinOrder}
                onChange={(e) => setFormMinOrder(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="coup-limit">Usage Limit (leave empty for unlimited)</Label>
              <Input
                id="coup-limit"
                type="number"
                min="0"
                placeholder="Unlimited"
                value={formUsageLimit ?? ""}
                onChange={(e) =>
                  setFormUsageLimit(e.target.value ? parseInt(e.target.value) : null)
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="coup-expiry">Expiry Date</Label>
              <Input
                id="coup-expiry"
                type="date"
                value={formExpiry}
                onChange={(e) => setFormExpiry(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Coupon can be used on checkout
                </p>
              </div>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingCoupon ? "Save Changes" : "Create Coupon"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this coupon? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
