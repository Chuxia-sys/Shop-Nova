"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ElementType } from "react";
import {
  Bell,
  BellRing,
  ShoppingBag,
  Truck,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  X,
  CheckCheck,
  Clock,
  Package,
  Star,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: "ORDER_CONFIRMED" | "ORDER_SHIPPED" | "ORDER_DELIVERED" | "PAYMENT_RECEIVED" | "REVIEW_REMINDER" | "PROMOTION" | "SYSTEM";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const NOTIFICATION_ICONS: Record<string, ElementType> = {
  ORDER_CONFIRMED: CheckCircle2,
  ORDER_SHIPPED: Truck,
  ORDER_DELIVERED: Package,
  PAYMENT_RECEIVED: CreditCard,
  REVIEW_REMINDER: Star,
  PROMOTION: Bell,
  SYSTEM: AlertCircle,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  ORDER_CONFIRMED: "text-green-500 bg-green-50 dark:bg-green-900/20",
  ORDER_SHIPPED: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  ORDER_DELIVERED: "text-purple-500 bg-purple-50 dark:bg-purple-900/20",
  PAYMENT_RECEIVED: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
  REVIEW_REMINDER: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
  PROMOTION: "text-rose-500 bg-rose-50 dark:bg-rose-900/20",
  SYSTEM: "text-gray-500 bg-gray-50 dark:bg-gray-900/20",
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "ORDER_CONFIRMED",
    title: "Order Confirmed",
    message: "Your order SN-A1B2-X3C4 has been confirmed and is being processed.",
    isRead: false,
    createdAt: new Date("2026-07-06T10:30:00"),
  },
  {
    id: "2",
    type: "ORDER_SHIPPED",
    title: "Order Shipped",
    message: "Your order SN-D5E6-F7G8 has been shipped via UPS. Track your package.",
    isRead: false,
    createdAt: new Date("2026-07-05T14:20:00"),
  },
  {
    id: "3",
    type: "PAYMENT_RECEIVED",
    title: "Payment Received",
    message: "Payment of $89.99 for order SN-A1B2-X3C4 has been processed successfully.",
    isRead: true,
    createdAt: new Date("2026-07-04T09:15:00"),
  },
  {
    id: "4",
    type: "REVIEW_REMINDER",
    title: "Review Request",
    message: "How was your Wireless Bluetooth Headphones? Share your experience with a review.",
    isRead: true,
    createdAt: new Date("2026-07-03T11:00:00"),
  },
  {
    id: "5",
    type: "ORDER_DELIVERED",
    title: "Order Delivered",
    message: "Your order SN-P7Q8-R9S0 has been delivered. Enjoy your purchase!",
    isRead: false,
    createdAt: new Date("2026-07-02T16:45:00"),
  },
  {
    id: "6",
    type: "SYSTEM",
    title: "Password Changed",
    message: "Your account password was changed successfully. If this wasn't you, contact support.",
    isRead: true,
    createdAt: new Date("2026-06-30T08:00:00"),
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  function markAllAsRead() {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
    toast.success("All notifications marked as read");
  }

  function dismissNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function dismissAll() {
    setNotifications([]);
    toast.success("All notifications dismissed");
  }

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
          { label: "Notifications" },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="default" className="h-6 px-2 text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">
            Stay updated with your orders and account activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={dismissAll}
            >
              <X className="h-4 w-4" />
              Dismiss All
            </Button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      {notifications.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              <AnimatePresence mode="popLayout">
                {notifications.map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.type] ?? Bell;
                  return (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "relative flex items-start gap-4 px-4 py-4 sm:px-6",
                        !notification.isRead && "bg-primary/5"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <span className="absolute left-0 top-0 h-full w-0.5 bg-primary" />
                      )}

                      {/* Icon */}
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          NOTIFICATION_COLORS[notification.type]
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p
                              className={cn(
                                "text-sm",
                                !notification.isRead ? "font-semibold" : "text-muted-foreground"
                              )}
                            >
                              {notification.title}
                            </p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDateTime(notification.createdAt)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 transition-opacity hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(notification.id);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              icon={BellRing}
              title="All caught up!"
              description="You have no notifications at this time."
            />
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
