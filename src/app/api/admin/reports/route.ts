import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCollection } from "@/lib/firestore";
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
  paymentMethod?: string | null;
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
  slug: string;
  price: number;
  quantity: number;
  isActive: boolean;
  categoryId: string;
}

interface ProductImageDoc extends FirestoreDocument {
  productId: string;
  url: string;
  isPrimary: boolean;
}

interface CategoryDoc extends FirestoreDocument {
  name: string;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "revenue";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const format = searchParams.get("format") || "json";

    const now = new Date();
    let startDate: Date;
    const endDate: Date = endDateParam ? new Date(endDateParam) : now;

    if (startDateParam) {
      startDate = new Date(startDateParam);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    let reportData;

    switch (type) {
      case "revenue": {
        reportData = await generateRevenueReport(startDate, endDate);
        break;
      }
      case "sales": {
        reportData = await generateSalesReport(startDate, endDate);
        break;
      }
      case "products": {
        reportData = await generateProductsReport(startDate, endDate);
        break;
      }
      default: {
        return NextResponse.json(
          { success: false, error: `Invalid report type: "${type}". Use: revenue, sales, or products.` },
          { status: 400 }
        );
      }
    }

    // Handle CSV format
    if (format === "csv") {
      const csvContent = generateCSV(reportData, type);
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${type}-report-${startDate.toISOString().split("T")[0]}-to-${endDate.toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      meta: {
        type,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Admin reports error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

// ─── Revenue Report ─────────────────────────────────────────────────
async function generateRevenueReport(startDate: Date, endDate: Date) {
  const allOrders = await getCollection<OrderDoc>("orders");
  const orders = allOrders.filter((o) => {
    if (o.deleted) return false;
    if (o.paymentStatus !== "COMPLETED") return false;
    const d = parseDate(o.createdAt);
    return d >= startDate && d <= endDate;
  }).sort((a, b) => {
    const aDate = parseDate(a.createdAt).getTime();
    const bDate = parseDate(b.createdAt).getTime();
    return aDate - bDate;
  });

  // Aggregate by day
  const dailyMap = new Map<string, {
    date: string;
    revenue: number;
    orders: number;
    subtotal: number;
    shipping: number;
    tax: number;
    discounts: number;
  }>();

  for (const order of orders) {
    const d = parseDate(order.createdAt);
    const day = d.toISOString().split("T")[0];
    const existing = dailyMap.get(day) || {
      date: day,
      revenue: 0,
      orders: 0,
      subtotal: 0,
      shipping: 0,
      tax: 0,
      discounts: 0,
    };
    existing.revenue += Number(order.total || 0);
    existing.orders += 1;
    existing.subtotal += Number(order.subtotal || 0);
    existing.shipping += Number(order.shippingFee || 0);
    existing.tax += Number(order.taxAmount || 0);
    existing.discounts += Number(order.discountAmount || 0);
    dailyMap.set(day, existing);
  }

  // Fill gaps in date range
  const dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
    subtotal: number;
    shipping: number;
    tax: number;
    discounts: number;
  }> = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const day = current.toISOString().split("T")[0];
    dailyRevenue.push(
      dailyMap.get(day) || {
        date: day,
        revenue: 0,
        orders: 0,
        subtotal: 0,
        shipping: 0,
        tax: 0,
        discounts: 0,
      }
    );
    current.setDate(current.getDate() + 1);
  }

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    summary: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    },
    dailyRevenue,
  };
}

// ─── Sales Report ───────────────────────────────────────────────────
async function generateSalesReport(startDate: Date, endDate: Date) {
  const allOrders = await getCollection<OrderDoc>("orders");
  const filteredOrders = allOrders.filter((o) => {
    if (o.deleted) return false;
    const d = parseDate(o.createdAt);
    return d >= startDate && d <= endDate;
  });

  // Orders by status
  const statusMap = new Map<string, { count: number; total: number }>();
  for (const order of filteredOrders) {
    const status = order.status || "UNKNOWN";
    const existing = statusMap.get(status) || { count: 0, total: 0 };
    existing.count += 1;
    existing.total += Number(order.total || 0);
    statusMap.set(status, existing);
  }

  // Orders by payment method
  const paymentMethodMap = new Map<string, { count: number; total: number }>();
  for (const order of filteredOrders) {
    if (!order.paymentMethod) continue;
    const existing = paymentMethodMap.get(order.paymentMethod) || { count: 0, total: 0 };
    existing.count += 1;
    existing.total += Number(order.total || 0);
    paymentMethodMap.set(order.paymentMethod, existing);
  }

  // Orders by payment status
  const paymentStatusMap = new Map<string, { count: number; total: number }>();
  for (const order of filteredOrders) {
    const ps = order.paymentStatus || "UNKNOWN";
    const existing = paymentStatusMap.get(ps) || { count: 0, total: 0 };
    existing.count += 1;
    existing.total += Number(order.total || 0);
    paymentStatusMap.set(ps, existing);
  }

  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  return {
    summary: {
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    },
    byStatus: Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      total: Math.round(data.total * 100) / 100,
      percentage: totalOrders > 0 ? Math.round((data.count / totalOrders) * 10000) / 100 : 0,
    })),
    byPaymentMethod: Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      total: Math.round(data.total * 100) / 100,
    })),
    byPaymentStatus: Array.from(paymentStatusMap.entries()).map(([ps, data]) => ({
      status: ps,
      count: data.count,
      total: Math.round(data.total * 100) / 100,
    })),
  };
}

// ─── Products Report ────────────────────────────────────────────────
async function generateProductsReport(startDate: Date, endDate: Date) {
  const [allOrders, allOrderItems, allProducts, allProductImages, allCategories] = await Promise.all([
    getCollection<OrderDoc>("orders"),
    getCollection<OrderItemDoc>("orderItems"),
    getCollection<ProductDoc>("products"),
    getCollection<ProductImageDoc>("productImages"),
    getCollection<CategoryDoc>("categories"),
  ]);

  const orderIdsInRange = new Set(
    allOrders
      .filter((o) => {
        if (o.deleted) return false;
        const d = parseDate(o.createdAt);
        return d >= startDate && d <= endDate;
      })
      .map((o) => o.id)
  );

  // Item sales in range
  const itemSales = allOrderItems.filter((i) => !i.deleted && orderIdsInRange.has(i.orderId));

  // Aggregate by product
  const productSalesMap = new Map<string, { name: string; quantity: number; total: number }>();
  for (const item of itemSales) {
    const existing = productSalesMap.get(item.productId) || { name: item.name, quantity: 0, total: 0 };
    existing.quantity += item.quantity || 0;
    existing.total += Number(item.total || 0);
    productSalesMap.set(item.productId, existing);
  }

  // Build product details lookup
  const catMap = new Map(allCategories.filter((c) => !c.deleted).map((c) => [c.id, c.name]));
  const primaryImages = new Map(
    allProductImages
      .filter((img) => !img.deleted && img.isPrimary)
      .map((img) => [img.productId, img.url])
  );

  // Top selling (sorted by quantity desc)
  const sortedBySales = Array.from(productSalesMap.entries())
    .map(([productId, data]) => {
      const prod = allProducts.find((p) => p.id === productId && !p.deleted);
      return {
        productId,
        name: data.name,
        slug: prod?.slug || "",
        price: prod ? Number(prod.price) : 0,
        category: prod?.categoryId ? (catMap.get(prod.categoryId) || null) : null,
        image: primaryImages.get(productId) || null,
        totalSold: data.quantity,
        totalRevenue: Math.round(data.total * 100) / 100,
        currentStock: prod?.quantity || 0,
        isActive: prod?.isActive ?? false,
      };
    })
    .sort((a, b) => b.totalSold - a.totalSold);

  const topProducts = sortedBySales.slice(0, 20);
  const bottomProducts = sortedBySales.slice(-10).reverse();

  // Products with no sales
  const productsWithSales = new Set(productSalesMap.keys());
  const unsoldProducts = allProducts.filter((p) => !p.deleted && !productsWithSales.has(p.id)).length;

  return {
    summary: {
      totalProductsSold: sortedBySales.reduce((sum, p) => sum + p.totalSold, 0),
      uniqueProductsSold: sortedBySales.length,
      productsWithNoSales: unsoldProducts,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    },
    topSelling: topProducts,
    bottomSelling: bottomProducts,
    unsoldProductCount: unsoldProducts,
  };
}

// ─── CSV Generator ──────────────────────────────────────────────────
function generateCSV(data: unknown, type: string): string {
  const escapeCsv = (val: unknown): string => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows: string[] = [];

  if (type === "revenue" && data && typeof data === "object" && "dailyRevenue" in data) {
    const report = data as {
      dailyRevenue: Array<Record<string, unknown>>;
      summary: Record<string, unknown>;
    };

    // Summary section
    rows.push("Summary");
    rows.push(`Total Revenue,${escapeCsv(report.summary.totalRevenue)}`);
    rows.push(`Total Orders,${escapeCsv(report.summary.totalOrders)}`);
    rows.push(`Average Order Value,${escapeCsv(report.summary.averageOrderValue)}`);
    rows.push("");

    // Daily section
    rows.push("Daily Revenue");
    rows.push("Date,Revenue,Orders,Subtotal,Shipping,Tax,Discounts");
    for (const day of report.dailyRevenue) {
      rows.push(
        [
          escapeCsv(day.date),
          escapeCsv(day.revenue),
          escapeCsv(day.orders),
          escapeCsv(day.subtotal),
          escapeCsv(day.shipping),
          escapeCsv(day.tax),
          escapeCsv(day.discounts),
        ].join(",")
      );
    }
  } else if (type === "sales" && data && typeof data === "object") {
    const report = data as {
      summary: Record<string, unknown>;
      byStatus: Array<Record<string, unknown>>;
      byPaymentMethod: Array<Record<string, unknown>>;
      byPaymentStatus: Array<Record<string, unknown>>;
    };

    rows.push("Summary");
    rows.push(`Total Orders,${escapeCsv(report.summary.totalOrders)}`);
    rows.push(`Total Revenue,${escapeCsv(report.summary.totalRevenue)}`);
    rows.push("");

    rows.push("Orders by Status");
    rows.push("Status,Count,Total,Percentage");
    for (const item of report.byStatus) {
      rows.push(
        [escapeCsv(item.status), escapeCsv(item.count), escapeCsv(item.total), escapeCsv(item.percentage)].join(",")
      );
    }
    rows.push("");

    rows.push("Orders by Payment Method");
    rows.push("Method,Count,Total");
    for (const item of report.byPaymentMethod) {
      rows.push(
        [escapeCsv(item.method), escapeCsv(item.count), escapeCsv(item.total)].join(",")
      );
    }
  } else if (type === "products" && data && typeof data === "object") {
    const report = data as {
      summary: Record<string, unknown>;
      topSelling: Array<Record<string, unknown>>;
      bottomSelling: Array<Record<string, unknown>>;
    };

    rows.push("Summary");
    rows.push(`Total Products Sold,${escapeCsv(report.summary.totalProductsSold)}`);
    rows.push(`Unique Products Sold,${escapeCsv(report.summary.uniqueProductsSold)}`);
    rows.push(`Products With No Sales,${escapeCsv(report.summary.productsWithNoSales)}`);
    rows.push("");

    rows.push("Top Selling Products");
    rows.push("Product ID,Name,Slug,Price,Category,Total Sold,Total Revenue,Current Stock");
    for (const item of report.topSelling) {
      rows.push(
        [
          escapeCsv(item.productId),
          escapeCsv(item.name),
          escapeCsv(item.slug),
          escapeCsv(item.price),
          escapeCsv(item.category),
          escapeCsv(item.totalSold),
          escapeCsv(item.totalRevenue),
          escapeCsv(item.currentStock),
        ].join(",")
      );
    }
  }

  return rows.join("\n");
}
