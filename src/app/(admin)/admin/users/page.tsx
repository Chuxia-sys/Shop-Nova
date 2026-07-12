"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, Shield, Ban, CheckCircle, UserCog } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { cn, formatDate, formatPrice, getInitials } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "super_admin" | "admin" | "moderator";
  status: "active" | "banned";
  orders: number;
  joinedDate: Date;
  lastActive: Date;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_USERS: AdminUser[] = [
  { id: "1", name: "Admin User", email: "admin@shopnova.com", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80", role: "super_admin", status: "active", orders: 0, joinedDate: new Date("2024-01-01"), lastActive: new Date("2026-07-08") },
  { id: "2", name: "Sarah Johnson", email: "sarah@shopnova.com", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80", role: "admin", status: "active", orders: 12, joinedDate: new Date("2024-03-15"), lastActive: new Date("2026-07-07") },
  { id: "3", name: "Mike Chen", email: "mike@shopnova.com", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80", role: "admin", status: "active", orders: 8, joinedDate: new Date("2024-04-20"), lastActive: new Date("2026-07-06") },
  { id: "4", name: "Emily Rodriguez", email: "emily@shopnova.com", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80", role: "moderator", status: "active", orders: 5, joinedDate: new Date("2024-06-10"), lastActive: new Date("2026-07-05") },
  { id: "5", name: "David Kim", email: "david@shopnova.com", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80", role: "moderator", status: "banned", orders: 3, joinedDate: new Date("2024-08-01"), lastActive: new Date("2026-06-15") },
  { id: "6", name: "Lisa Thompson", email: "lisa@shopnova.com", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80", role: "admin", status: "active", orders: 20, joinedDate: new Date("2024-02-14"), lastActive: new Date("2026-07-08") },
  { id: "7", name: "James Wilson", email: "james@shopnova.com", image: null, role: "moderator", status: "active", orders: 7, joinedDate: new Date("2024-09-05"), lastActive: new Date("2026-07-04") },
  { id: "8", name: "Amanda Foster", email: "amanda@shopnova.com", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80", role: "admin", status: "active", orders: 15, joinedDate: new Date("2024-05-22"), lastActive: new Date("2026-07-07") },
];

const ROLE_STYLES: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  moderator: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Role change dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<AdminUser["role"]>("admin");

  // Ban dialog
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, roleFilter, statusFilter]);

  const openRoleChange = (user: AdminUser) => {
    setRoleTarget(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleRoleChange = () => {
    if (!roleTarget) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === roleTarget.id ? { ...u, role: newRole } : u
      )
    );
    toast.success(`${roleTarget.name}'s role changed to ${newRole.replace("_", " ")}`);
    setRoleDialogOpen(false);
  };

  const openBanDialog = (user: AdminUser) => {
    setBanTarget(user);
    setBanDialogOpen(true);
  };

  const handleBanToggle = () => {
    if (!banTarget) return;
    const newStatus = banTarget.status === "active" ? "banned" : "active";
    setUsers((prev) =>
      prev.map((u) =>
        u.id === banTarget.id ? { ...u, status: newStatus } : u
      )
    );
    toast.success(
      `${banTarget.name} ${newStatus === "banned" ? "banned" : "unbanned"}`
    );
    setBanDialogOpen(false);
  };

  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: "name",
      header: "User",
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
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={cn("font-medium capitalize", ROLE_STYLES[row.original.role])}
        >
          {row.original.role.replace("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === "active" ? "default" : "destructive"}
          className={cn(
            "font-normal",
            row.original.status === "active"
              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : ""
          )}
        >
          {row.original.status === "active" ? "Active" : "Banned"}
        </Badge>
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
      accessorKey: "joinedDate",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.joinedDate)}
        </span>
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
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Actions
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => openRoleChange(row.original)}>
              <Shield className="mr-2 h-4 w-4" />
              Change Role
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={
                row.original.status === "active"
                  ? "text-destructive focus:text-destructive"
                  : "text-green-600 focus:text-green-600"
              }
              onClick={() => openBanDialog(row.original)}
            >
              {row.original.status === "active" ? (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Ban User
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Unban User
                </>
              )}
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
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">
          Manage admin users and their permissions
        </p>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredUsers}
          searchable
          searchPlaceholder="Search users..."
          pageSize={10}
          className="p-0 border-0"
        />
      </GlassCard>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update role for {roleTarget?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-role">New Role</Label>
              <Select
                value={newRole}
                onValueChange={(v) => setNewRole(v as AdminUser["role"])}
              >
                <SelectTrigger id="new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban/Unban Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {banTarget?.status === "active" ? "Ban User" : "Unban User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {banTarget?.status === "active"
                ? `Are you sure you want to ban ${banTarget?.name}? They will lose access to the admin panel.`
                : `Are you sure you want to unban ${banTarget?.name}? They will regain access to the admin panel.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanToggle}
              className={
                banTarget?.status === "active"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {banTarget?.status === "active" ? "Ban User" : "Unban User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
