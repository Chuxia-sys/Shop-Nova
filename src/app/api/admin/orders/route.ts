import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { PAGINATION } from "@/lib/constants";
import { getCollection, getDocument, queryCollection } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";

interface OrderDoc extends FirestoreDocument {
  orderNumber: string;
  userId: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  notes?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
}

interface OrderItemDoc extends FirestoreDocument {
  orderId: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
  imageUrl?: string;
}

interface PaymentDoc extends FirestoreDocument {
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  createdAt: string;
}

interface UserDoc extends FirestoreDocument {
  name?: string;
  email?: string;
  image?: string;
}

function parseDate(date: unknown): Date {
  if (typeof date === "string") return new Date(date);
  if (date instanceof Date) return date;
  if (date && typeof date === "object" && "toDate" in (date as any)) {
    return (date as any).toDate();
  }
  return new Date(0);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      PAGINATION.ADMIN_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("limit") || String(PAGINATION.ORDER_PAGE_SIZE), 10))
    );
    const sort = searchParams.get("sort") || "newest";

    // Fetch all orders from Firestore
    let allOrders = await getCollection<OrderDoc>("orders");
    allOrders = allOrders.filter((o) => !o.deleted);

    // Fetch all users for search
    const allUsers = await getCollection<UserDoc>("users");

    // Build user lookup map
    const userMap = new Map(allUsers.filter((u) => !u.deleted).map((u) => [u.id, u]));

    // Apply filters
    if (status) {
      allOrders = allOrders.filter((o) => o.status === status);
    }

    if (paymentStatus) {
      allOrders = allOrders.filter((o) => o.paymentStatus === paymentStatus);
    }

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date(8640000000000000);
      allOrders = allOrders.filter((o) => {
        const d = parseDate(o.createdAt);
        return d >= start && d <= end;
      });
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      allOrders = allOrders.filter((o) => {
        const user = userMap.get(o.userId);
        const userName = (user?.name || "").toLowerCase();
        const userEmail = (user?.email || "").toLowerCase();
        return (
          (o.orderNumber || "").toLowerCase().includes(lowerSearch) ||
          userName.includes(lowerSearch) ||
          userEmail.includes(lowerSearch)
        );
      });
    }

    // Sort
    const sortDir = sort === "oldest" ? 1 : -1;
    allOrders.sort((a, b) => {
      const aVal = parseDate(a.createdAt).getTime();
      const bVal = parseDate(b.createdAt).getTime();
      return (aVal - bVal) * sortDir;
    });

    // Paginate
    const totalCount = allOrders.length;
    const startIdx = (page - 1) * limit;
    const paginatedOrders = allOrders.slice(startIdx, startIdx + limit);

    // Enrich with items, payment, and user data
    const data = await Promise.all(
      paginatedOrders.map(async (order) => {
        const items = await queryCollection<OrderItemDoc>(
          "orderItems",
          [
            { field: "orderId", operator: "==", value: order.id },
            { field: "deleted", operator: "==", value: false },
          ]
        );

        const payments = await queryCollection<PaymentDoc>(
          "payments",
          [
            { field: "orderId", operator: "==", value: order.id },
            { field: "deleted", operator: "==", value: false },
          ]
        );

        const user = userMap.get(order.userId);

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          userId: order.userId,
          user: user ? { id: user.id, name: user.name || null, email: user.email || "", image: user.image || null } : null,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod || null,
          subtotal: Number(order.subtotal || 0),
          shippingFee: Number(order.shippingFee || 0),
          taxAmount: Number(order.taxAmount || 0),
          discountAmount: Number(order.discountAmount || 0),
          total: Number(order.total || 0),
          currency: order.currency || "USD",
          notes: order.notes || null,
          shippingCarrier: order.shippingCarrier || null,
          trackingNumber: order.trackingNumber || null,
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            sku: item.sku,
            price: Number(item.price),
            quantity: item.quantity,
            total: Number(item.total),
            imageUrl: item.imageUrl || null,
            productId: item.productId,
          })),
          payment: payments[0]
            ? {
                id: payments[0].id,
                amount: Number(payments[0].amount),
                currency: payments[0].currency,
                status: payments[0].status,
                method: payments[0].method || null,
                createdAt: payments[0].createdAt,
              }
            : null,
          itemCount: items.length,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Admin orders fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
