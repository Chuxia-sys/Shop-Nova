import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDocument, queryCollection, createDocument, updateDocument } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";
import { sendEmail, renderShippingUpdateEmail } from "@/lib/email";
import { updateOrderStatusSchema } from "@/lib/validations";

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};

const notificationTypeMap: Record<string, string> = {
  CONFIRMED: "ORDER_CONFIRMED",
  SHIPPED: "ORDER_SHIPPED",
  DELIVERED: "ORDER_DELIVERED",
  CANCELLED: "ORDER_CANCELLED",
};

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
  notes?: string | null;
  couponId?: string | null;
  addressId?: string | null;
  trackingNumber?: string | null;
  shippingCarrier?: string | null;
  estimatedDelivery?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  refundAmount?: number | null;
}

interface OrderItemDoc extends FirestoreDocument {
  orderId: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
  imageUrl?: string | null;
}

interface PaymentDoc extends FirestoreDocument {
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  stripePaymentId?: string;
  receiptUrl?: string;
}

interface AddressDoc extends FirestoreDocument {
  fullName: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface UserDoc extends FirestoreDocument {
  name?: string;
  email?: string;
  image?: string;
  phone?: string;
}

interface ProductDoc extends FirestoreDocument {
  name: string;
  slug: string;
  quantity: number;
}

interface ProductImageDoc extends FirestoreDocument {
  url: string;
  altText?: string;
  isPrimary: boolean;
  productId: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getCurrentUser();

    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      );
    }

    const isAdmin = auth.user.role === "ADMIN" || auth.user.role === "SUPER_ADMIN";

    const order = await getDocument<OrderDoc>("orders", id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Non-admin users can only see their own orders
    if (!isAdmin && order.userId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Fetch order items
    const items = await queryCollection<OrderItemDoc>(
      "orderItems",
      [
        { field: "orderId", operator: "==", value: id },
        { field: "deleted", operator: "==", value: false },
      ]
    );

    // Enrich items with product data
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const product = await getDocument<ProductDoc>("products", item.productId);
        const images = product
          ? await queryCollection<ProductImageDoc>(
              "productImages",
              [
                { field: "productId", operator: "==", value: item.productId },
                { field: "isPrimary", operator: "==", value: true },
              ],
              "order",
              "asc",
              1
            )
          : [];

        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          price: Number(item.price),
          quantity: item.quantity,
          total: Number(item.total),
          imageUrl: item.imageUrl || null,
          productId: item.productId,
          product: {
            name: product?.name || item.name,
            slug: product?.slug || "",
            image: images[0]?.url || null,
            imageAlt: images[0]?.altText || null,
          },
        };
      })
    );

    // Fetch address
    let address: AddressDoc | null = null;
    if (order.addressId) {
      address = await getDocument<AddressDoc>("addresses", order.addressId);
    }

    // Fetch payment
    const payments = await queryCollection<PaymentDoc>(
      "payments",
      [
        { field: "orderId", operator: "==", value: id },
        { field: "deleted", operator: "==", value: false },
      ]
    );
    const payment = payments[0] || null;

    // Fetch user (for admin)
    let user: UserDoc | null = null;
    if (isAdmin) {
      user = await getDocument<UserDoc>("users", order.userId);
    }

    const data = {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      taxAmount: Number(order.taxAmount),
      discountAmount: Number(order.discountAmount),
      total: Number(order.total),
      currency: order.currency || "USD",
      notes: order.notes || null,
      trackingNumber: order.trackingNumber || null,
      shippingCarrier: order.shippingCarrier || null,
      estimatedDelivery: order.estimatedDelivery || null,
      deliveredAt: order.deliveredAt || null,
      cancelledAt: order.cancelledAt || null,
      refundAmount: order.refundAmount ? Number(order.refundAmount) : null,
      items: enrichedItems,
      address: address
        ? {
            id: address.id,
            fullName: address.fullName,
            phone: address.phone,
            street: address.street,
            apartment: address.apartment || null,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
          }
        : null,
      payment: payment
        ? {
            id: payment.id,
            amount: Number(payment.amount),
            currency: payment.currency,
            status: payment.status,
            method: payment.method || null,
            stripePaymentId: payment.stripePaymentId || null,
            receiptUrl: payment.receiptUrl || null,
            createdAt: payment.createdAt,
          }
        : null,
      ...(isAdmin && user
        ? {
            user: {
              id: user.id,
              name: user.name || null,
              email: user.email || null,
              image: user.image || null,
              phone: user.phone || null,
            },
          }
        : {}),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Order fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getCurrentUser();

    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      );
    }

    if (auth.user.role !== "ADMIN" && auth.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateOrderStatusSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { status, trackingNumber, shippingCarrier, notes } = validated.data;

    // Fetch the current order
    const existingOrder = await getDocument<OrderDoc>("orders", id);
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Fetch user info
    const orderUser = await getDocument<UserDoc>("users", existingOrder.userId);

    // Validate status transition
    if (status && status !== existingOrder.status) {
      const allowedTransitions = VALID_TRANSITIONS[existingOrder.status];
      if (!allowedTransitions || !allowedTransitions.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot transition order from "${existingOrder.status}" to "${status}"`,
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (status) updateData.status = status;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (shippingCarrier !== undefined) updateData.shippingCarrier = shippingCarrier;
    if (notes !== undefined) updateData.notes = notes;

    // Set timestamps for terminal states
    if (status === "DELIVERED") {
      updateData.deliveredAt = new Date().toISOString();
    } else if (status === "CANCELLED") {
      updateData.cancelledAt = new Date().toISOString();
    }

    // If cancelling, restore stock quantities
    if (status === "CANCELLED" && existingOrder.status !== "CANCELLED") {
      const items = await queryCollection<OrderItemDoc>(
        "orderItems",
        [
          { field: "orderId", operator: "==", value: id },
          { field: "deleted", operator: "==", value: false },
        ]
      );

      for (const item of items) {
        const product = await getDocument<ProductDoc>("products", item.productId);
        if (product) {
          await updateDocument<ProductDoc>("products", item.productId, {
            quantity: (product.quantity || 0) + item.quantity,
          });
        }
      }
    }

    const updatedOrder = await updateDocument<OrderDoc>("orders", id, updateData);

    // Fetch items, address, payment for response
    const items = await queryCollection<OrderItemDoc>(
      "orderItems",
      [
        { field: "orderId", operator: "==", value: id },
        { field: "deleted", operator: "==", value: false },
      ]
    );

    let address: AddressDoc | null = null;
    if (existingOrder.addressId) {
      address = await getDocument<AddressDoc>("addresses", existingOrder.addressId);
    }

    const payments = await queryCollection<PaymentDoc>(
      "payments",
      [
        { field: "orderId", operator: "==", value: id },
        { field: "deleted", operator: "==", value: false },
      ]
    );
    const payment = payments[0] || null;

    // Create notification for the user on status change
    if (status && status !== existingOrder.status) {
      const notificationType = notificationTypeMap[status] || "ADMIN_ALERT";

      const statusLabels: Record<string, string> = {
        CONFIRMED: "Confirmed",
        PROCESSING: "Processing",
        SHIPPED: "Shipped",
        DELIVERED: "Delivered",
        CANCELLED: "Cancelled",
        REFUNDED: "Refunded",
      };

      await createDocument<FirestoreDocument>("notifications", {
        userId: existingOrder.userId,
        type: notificationType,
        title: `Order ${statusLabels[status] || status}`,
        message: `Your order ${existingOrder.orderNumber} has been updated to "${statusLabels[status] || status}".`,
        link: `/dashboard/orders/${existingOrder.id}`,
        isRead: false,
      });

      // Send shipping update email
      if (orderUser?.email) {
        await sendEmail({
          to: orderUser.email,
          subject: `Order Update — ${existingOrder.orderNumber}`,
          html: renderShippingUpdateEmail(
            orderUser.name || "Valued Customer",
            existingOrder.orderNumber,
            statusLabels[status] || status,
            trackingNumber
          ),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedOrder,
        subtotal: Number(updatedOrder.subtotal),
        shippingFee: Number(updatedOrder.shippingFee),
        taxAmount: Number(updatedOrder.taxAmount),
        discountAmount: Number(updatedOrder.discountAmount),
        total: Number(updatedOrder.total),
        refundAmount: updatedOrder.refundAmount ? Number(updatedOrder.refundAmount) : null,
        items: items.map((item) => ({
          ...item,
          price: Number(item.price),
          total: Number(item.total),
        })),
        payment: payment
          ? {
              ...payment,
              amount: Number(payment.amount),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}
