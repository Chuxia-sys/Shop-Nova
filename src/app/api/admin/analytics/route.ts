import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCollection, getDocument } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";

function parseDate(date: unknown): Date {
  if (typeof date === "string") return new Date(date);
  if (date instanceof Date) return date;
  if (date && typeof date === "object" && "toDate" in (date as any)) {
    return (date as any).toDate();
  }
  return new Date(0);
}

interface OrderDoc extends FirestoreDocument {
  orderNumber: string;
  userId: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
}

interface OrderItemDoc extends FirestoreDocument {
  orderId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface ProductDoc extends FirestoreDocument {
  name: string;
  quantity: number;
}

interface UserDoc extends FirestoreDocument {
  role: string;
  isActive: boolean;
  isBanned: boolean;
}

export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    const currentYear = now.getFullYear();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const currentPeriodStart = thirtyDaysAgo;
    const previousPeriodStart = sixtyDaysAgo;
    const previousPeriodEnd = thirtyDaysAgo;

    // Fetch all data from Firestore
    const [allOrders, allProducts, allUsers, allOrderItems] = await Promise.all([
      getCollection<OrderDoc>("orders"),
      getCollection<ProductDoc>("products"),
      getCollection<UserDoc>("users"),
      getCollection<OrderItemDoc>("orderItems"),
    ]);

    // Filter out deleted
    const activeOrders = allOrders.filter((o) => !o.deleted);
    const activeProducts = allProducts.filter((p) => !p.deleted);
    const activeUsers = allUsers.filter((u) => !u.deleted);
    const activeOrderItems = allOrderItems.filter((i) => !i.deleted);

    // Completed orders
    const completedOrders = activeOrders.filter((o) => o.paymentStatus === "COMPLETED");

    // Total revenue
    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    // Total orders
    const totalOrdersCount = activeOrders.length;

    // Total products
    const totalProductsCount = activeProducts.length;

    // Total customers
    const totalCustomersCount = activeUsers.filter((u) => u.role === "CUSTOMER").length;

    // Current period revenue & orders
    const currentOrders = activeOrders.filter((o) => {
      const d = parseDate(o.createdAt);
      return d >= currentPeriodStart;
    });
    const currentRevenue = currentOrders
      .filter((o) => o.paymentStatus === "COMPLETED")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    // Previous period revenue & orders
    const previousOrders = activeOrders.filter((o) => {
      const d = parseDate(o.createdAt);
      return d >= previousPeriodStart && d < previousPeriodEnd;
    });
    const previousRevenue = previousOrders
      .filter((o) => o.paymentStatus === "COMPLETED")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    const revenueChange =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0 ? 100 : 0;

    const ordersChange =
      previousOrders.length > 0
        ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100
        : currentOrders.length > 0 ? 100 : 0;

    // Recent orders (last 7 days)
    const recentOrdersCount = activeOrders.filter((o) => {
      const d = parseDate(o.createdAt);
      return d >= sevenDaysAgo;
    }).length;

    // Pending orders
    const pendingOrdersCount = activeOrders.filter((o) => o.status === "PENDING").length;

    // Low stock products
    const lowStockCount = activeProducts.filter((p) => (p.quantity || 0) < 10).length;

    // Revenue by day for last 30 days
    const revenueByDayMap = new Map<string, number>();
    for (const order of completedOrders) {
      const d = parseDate(order.createdAt);
      if (d >= thirtyDaysAgo) {
        const day = d.toISOString().split("T")[0];
        revenueByDayMap.set(day, (revenueByDayMap.get(day) || 0) + Number(order.total || 0));
      }
    }

    const revenueByDayArray = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const dayKey = d.toISOString().split("T")[0];
      revenueByDayArray.push({
        date: dayKey,
        revenue: revenueByDayMap.get(dayKey) || 0,
      });
    }

    // Sales by category (from order items)
    const categorySalesMap = new Map<string, { total: number; quantity: number }>();
    for (const item of activeOrderItems) {
      const key = item.name || "Unknown";
      const existing = categorySalesMap.get(key) || { total: 0, quantity: 0 };
      existing.total += Number(item.total || 0);
      existing.quantity += item.quantity || 0;
      categorySalesMap.set(key, existing);
    }
    const salesByCategory = Array.from(categorySalesMap.entries())
      .map(([name, data]) => ({ name, total: data.total, quantity: data.quantity }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Top 10 selling products
    const productSalesMap = new Map<string, { name: string; quantity: number; total: number }>();
    for (const item of activeOrderItems) {
      const key = item.productId;
      const existing = productSalesMap.get(key) || { name: item.name || "Unknown", quantity: 0, total: 0 };
      existing.quantity += item.quantity || 0;
      existing.total += Number(item.total || 0);
      productSalesMap.set(key, existing);
    }
    const topProducts = Array.from(productSalesMap.entries())
      .map(([productId, data]) => ({ productId, name: data.name, quantity: data.quantity, total: data.total }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Monthly revenue for current year
    const monthlyMap = new Map<string, number>();
    for (const order of completedOrders) {
      const d = parseDate(order.createdAt);
      if (d.getFullYear() === currentYear) {
        const monthKey = `${currentYear}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + Number(order.total || 0));
      }
    }

    const monthlyRevenueArray = [];
    for (let m = 0; m < 12; m++) {
      const monthKey = `${currentYear}-${String(m + 1).padStart(2, "0")}`;
      monthlyRevenueArray.push({
        month: monthKey,
        revenue: monthlyMap.get(monthKey) || 0,
      });
    }

    // Top products with product details
    const topProductIds = topProducts.map((p) => p.productId);
    const productDocs = await Promise.all(
      topProductIds.map((id) => getDocument<ProductDoc>("products", id))
    );
    const productDetailMap = new Map(productDocs.filter(Boolean).map((p) => [p!.id, p!]));
    const topSellingProducts = topProducts.map((p) => {
      const details = productDetailMap.get(p.productId);
      return {
        productId: p.productId,
        name: p.name,
        slug: (details as any)?.slug || "",
        price: details ? Number((details as any).price || 0) : 0,
        image: null,
        totalSold: p.quantity,
        totalRevenue: p.total,
      };
    });

    // Customers change
    const currentCustomers = activeUsers.filter((u) => {
      const d = parseDate(u.createdAt);
      return u.role === "CUSTOMER" && d >= currentPeriodStart;
    }).length;
    const previousCustomers = activeUsers.filter((u) => {
      const d = parseDate(u.createdAt);
      return u.role === "CUSTOMER" && d >= previousPeriodStart && d < previousPeriodEnd;
    }).length;
    const customersChange =
      previousCustomers > 0
        ? ((currentCustomers - previousCustomers) / previousCustomers) * 100
        : currentCustomers > 0 ? 100 : 0;

    // Products change
    const currentProducts = activeProducts.filter((p) => {
      const d = parseDate(p.createdAt);
      return d >= currentPeriodStart;
    }).length;
    const previousProducts = activeProducts.filter((p) => {
      const d = parseDate(p.createdAt);
      return d >= previousPeriodStart && d < previousPeriodEnd;
    }).length;
    const productsChange =
      previousProducts > 0
        ? ((currentProducts - previousProducts) / previousProducts) * 100
        : currentProducts > 0 ? 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders: totalOrdersCount,
        totalProducts: totalProductsCount,
        totalCustomers: totalCustomersCount,
        revenueChange: Math.round(revenueChange * 100) / 100,
        ordersChange: Math.round(ordersChange * 100) / 100,
        productsChange: Math.round(productsChange * 100) / 100,
        customersChange: Math.round(customersChange * 100) / 100,
        recentOrdersCount,
        pendingOrdersCount,
        lowStockCount,
        revenueByDay: revenueByDayArray,
        salesByCategory,
        topSellingProducts,
        monthlyRevenue: monthlyRevenueArray,
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
