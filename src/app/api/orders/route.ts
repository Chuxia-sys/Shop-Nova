import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { queryCollection, getDocument, createDocument, updateDocument, deleteDocument, batchWrite } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";
import { generateOrderNumber } from "@/lib/utils";
import { sendEmail, renderOrderConfirmationEmail } from "@/lib/email";
import { SHIPPING_FEE, FREE_SHIPPING_THRESHOLD, PAGINATION } from "@/lib/constants";
import { z } from "zod";

const TAX_RATE = parseFloat(process.env.TAX_RATE || "0.08");

const createOrderSchema = z.object({
  addressId: z.string().min(1, "Shipping address is required"),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

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
  userId: string;
  fullName: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface CartItemDoc extends FirestoreDocument {
  userId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
}

interface ProductDoc extends FirestoreDocument {
  name: string;
  slug: string;
  price: number;
  sku: string;
  quantity: number;
  isActive: boolean;
  isDigital?: boolean;
}

interface ProductImageDoc extends FirestoreDocument {
  url: string;
  altText?: string;
  isPrimary: boolean;
  productId: string;
}

interface UserDoc extends FirestoreDocument {
  name?: string;
  email?: string;
  image?: string;
}

interface CouponDoc extends FirestoreDocument {
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  perUserLimit: number;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentUser();
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      PAGINATION.ADMIN_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("limit") || String(PAGINATION.ORDER_PAGE_SIZE), 10))
    );
    const isAdmin = auth.user.role === "ADMIN" || auth.user.role === "SUPER_ADMIN";

    const filters: any[] = [{ field: "deleted", operator: "==", value: false }];
    if (!isAdmin) {
      filters.push({ field: "userId", operator: "==", value: auth.user.id });
    }

    const allOrders = await queryCollection<OrderDoc>(
      "orders",
      filters,
      "createdAt",
      "desc"
    );

    // Paginate in memory
    const totalCount = allOrders.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIdx = (page - 1) * limit;
    const paginatedOrders = allOrders.slice(startIdx, startIdx + limit);

    // Enrich orders with items, address, payment, and user info
    const data = await Promise.all(
      paginatedOrders.map(async (order) => {
        // Fetch order items
        const items = await queryCollection<OrderItemDoc>(
          "orderItems",
          [
            { field: "orderId", operator: "==", value: order.id },
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
            { field: "orderId", operator: "==", value: order.id },
            { field: "deleted", operator: "==", value: false },
          ]
        );
        const payment = payments[0] || null;

        // Fetch user (for admin)
        let user: UserDoc | null = null;
        if (isAdmin) {
          user = await getDocument<UserDoc>("users", order.userId);
        }

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          userId: order.userId,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: payment?.method || null,
          subtotal: Number(order.subtotal),
          shippingFee: Number(order.shippingFee),
          taxAmount: Number(order.taxAmount),
          discountAmount: Number(order.discountAmount),
          total: Number(order.total),
          currency: order.currency || "USD",
          notes: order.notes || null,
          trackingNumber: order.trackingNumber || null,
          shippingCarrier: order.shippingCarrier || null,
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
                },
              }
            : {}),
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
        totalPages,
      },
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = createOrderSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { addressId, couponCode, notes } = validated.data;

    // Fetch user's cart items with product data
    const cartItems = await queryCollection<CartItemDoc>(
      "cartItems",
      [
        { field: "userId", operator: "==", value: auth.user.id },
        { field: "deleted", operator: "==", value: false },
      ]
    );

    if (cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Enrich cart items with product data
    const enrichedCart = await Promise.all(
      cartItems.map(async (item) => {
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
        return { ...item, product, image: images[0] || null };
      })
    );

    const validItems = enrichedCart.filter((item): item is typeof item & { product: ProductDoc } => item.product !== null);

    // Validate all items are active and in stock
    for (const item of validItems) {
      if (!item.product.isActive) {
        return NextResponse.json(
          { success: false, error: `"${item.product.name}" is no longer available` },
          { status: 400 }
        );
      }

      if (item.product.quantity < item.quantity) {
        const available = item.product.quantity;
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for "${item.product.name}". ${available > 0 ? `Only ${available} available.` : "Out of stock."}`,
          },
          { status: 400 }
        );
      }
    }

    // Validate address belongs to user
    const address = await getDocument<AddressDoc>("addresses", addressId);
    if (!address || address.userId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Shipping address not found" },
        { status: 404 }
      );
    }

    // Calculate totals
    const subtotal = validItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    const shippingFee =
      subtotal >= FREE_SHIPPING_THRESHOLD || validItems.every((i) => i.product.isDigital)
        ? 0
        : SHIPPING_FEE;

    const taxAmount = subtotal * TAX_RATE;

    // Apply coupon if provided
    let discountAmount = 0;
    let couponId: string | null = null;

    if (couponCode) {
      const coupons = await queryCollection<CouponDoc>(
        "coupons",
        [
          { field: "code", operator: "==", value: couponCode.toUpperCase() },
          { field: "deleted", operator: "==", value: false },
        ]
      );

      const coupon = coupons[0];
      if (!coupon) {
        return NextResponse.json({ success: false, error: "Invalid coupon code" }, { status: 400 });
      }

      if (!coupon.isActive) {
        return NextResponse.json({ success: false, error: "Coupon is no longer active" }, { status: 400 });
      }

      const now = new Date();
      if (coupon.startsAt && now < new Date(coupon.startsAt)) {
        return NextResponse.json({ success: false, error: "Coupon is not yet valid" }, { status: 400 });
      }
      if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
        return NextResponse.json({ success: false, error: "Coupon has expired" }, { status: 400 });
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json({ success: false, error: "Coupon usage limit reached" }, { status: 400 });
      }

      if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
        return NextResponse.json(
          { success: false, error: `Minimum order amount of $${Number(coupon.minOrderAmount).toFixed(2)} required for this coupon` },
          { status: 400 }
        );
      }

      // Check per-user limit
      const userOrders = await queryCollection<any>(
        "orders",
        [
          { field: "userId", operator: "==", value: auth.user.id },
          { field: "couponId", operator: "==", value: coupon.id },
          { field: "deleted", operator: "==", value: false },
        ]
      );

      if (userOrders.length >= coupon.perUserLimit) {
        return NextResponse.json({ success: false, error: "Coupon usage limit reached for this account" }, { status: 400 });
      }

      // Calculate discount
      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = subtotal * (Number(coupon.discountValue) / 100);
        if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
          discountAmount = Number(coupon.maxDiscount);
        }
      } else {
        discountAmount = Number(coupon.discountValue);
        if (discountAmount > subtotal) discountAmount = subtotal;
      }

      couponId = coupon.id;
    }

    const total = Math.max(0, subtotal + shippingFee + taxAmount - discountAmount);

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order document
    const order = await createDocument<OrderDoc>("orders", {
      orderNumber,
      userId: auth.user.id,
      status: "PENDING",
      paymentStatus: "PENDING",
      subtotal,
      shippingFee,
      taxAmount,
      discountAmount,
      total,
      currency: "USD",
      couponId,
      notes: notes || null,
      addressId,
    });

    // Create order items
    for (const item of validItems) {
      await createDocument<OrderItemDoc>("orderItems", {
        orderId: order.id,
        productId: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        price: Number(item.product.price),
        quantity: item.quantity,
        total: Number(item.product.price) * item.quantity,
        imageUrl: item.image?.url || null,
      });
    }

    // Create pending payment record
    await createDocument<PaymentDoc>("payments", {
      orderId: order.id,
      amount: total,
      currency: "USD",
      status: "PENDING",
    });

    // Decrement stock for each product
    for (const item of validItems) {
      const product = await getDocument<ProductDoc>("products", item.product.id);
      if (product) {
        await updateDocument<ProductDoc>("products", item.product.id, {
          quantity: Math.max(0, product.quantity - item.quantity),
        });
      }
    }

    // Increment coupon usage
    if (couponId) {
      const coupon = await getDocument<CouponDoc>("coupons", couponId);
      if (coupon) {
        await updateDocument<CouponDoc>("coupons", couponId, {
          usedCount: (coupon.usedCount || 0) + 1,
        });
      }
    }

    // Clear the cart
    for (const item of cartItems) {
      await deleteDocument("cartItems", item.id);
    }

    // Send order confirmation email
    const userData = await getDocument<UserDoc>("users", auth.user.id);
    if (userData?.email) {
      const emailItems = validItems.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: Number(item.product.price),
      }));

      await sendEmail({
        to: userData.email,
        subject: `Order Confirmed — ${orderNumber}`,
        html: renderOrderConfirmationEmail(
          userData.name || "Valued Customer",
          orderNumber,
          emailItems,
          Number(total)
        ),
      });
    }

    // Create notification
    await createDocument<FirestoreDocument>("notifications", {
      userId: auth.user.id,
      type: "ORDER_CONFIRMED",
      title: "Order Confirmed",
      message: `Your order ${orderNumber} has been placed successfully.`,
      link: `/dashboard/orders/${order.id}`,
      isRead: false,
    });

    // Fetch order items for response
    const orderItems = await queryCollection<OrderItemDoc>(
      "orderItems",
      [
        { field: "orderId", operator: "==", value: order.id },
        { field: "deleted", operator: "==", value: false },
      ]
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          ...order,
          subtotal: Number(order.subtotal),
          shippingFee: Number(order.shippingFee),
          taxAmount: Number(order.taxAmount),
          discountAmount: Number(order.discountAmount),
          total: Number(order.total),
          items: orderItems.map((item) => ({
            ...item,
            price: Number(item.price),
            total: Number(item.total),
          })),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}
