import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createPaymentIntent } from "@/lib/stripe";
import { queryCollection, getDocument } from "@/lib/firestore";
import type { FirestoreDocument, QueryFilter } from "@/lib/firestore";
import { SHIPPING_FEE, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { z } from "zod";

const TAX_RATE = parseFloat(process.env.TAX_RATE || "0.08");

const createPaymentIntentSchema = z.object({
  couponCode: z.string().optional(),
});

interface CartItemDoc extends FirestoreDocument {
  userId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
}

interface ProductDoc extends FirestoreDocument {
  name: string;
  price: number;
  quantity: number;
  isActive: boolean;
  isDigital?: boolean;
}

interface CouponDoc extends FirestoreDocument {
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentUser();
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validated = createPaymentIntentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { couponCode } = validated.data;

    // Fetch cart items from Firestore
    const cartItems = await queryCollection<CartItemDoc>(
      "cartItems",
      [
        { field: "userId", operator: "==", value: auth.user.id },
        { field: "deleted", operator: "==", value: false },
      ],
      "createdAt",
      "asc"
    );

    if (cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Enrich with product data and validate
    const enrichedItems = await Promise.all(
      cartItems.map(async (item) => {
        const product = await getDocument<ProductDoc>("products", item.productId);
        if (!product) return null;

        return { item, product };
      })
    );

    const validItems = enrichedItems.filter((e): e is NonNullable<typeof e> => e !== null);

    if (validItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid products found in cart" },
        { status: 400 }
      );
    }

    // Validate stock
    for (const { item, product } of validItems) {
      if (!product.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: `"${product.name}" is no longer available`,
          },
          { status: 400 }
        );
      }

      if (product.quantity < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for "${product.name}"`,
          },
          { status: 400 }
        );
      }
    }

    // Calculate amount
    const subtotal = validItems.reduce(
      (sum, { item, product }) => sum + Number(product.price) * item.quantity,
      0
    );

    const shippingFee =
      subtotal >= FREE_SHIPPING_THRESHOLD ||
      validItems.every(({ product }) => product.isDigital)
        ? 0
        : SHIPPING_FEE;

    const taxAmount = subtotal * TAX_RATE;

    // Apply coupon if provided
    let discountAmount = 0;

    if (couponCode) {
      const coupons = await queryCollection<CouponDoc>(
        "coupons",
        [
          { field: "code", operator: "==", value: couponCode.toUpperCase() },
          { field: "deleted", operator: "==", value: false },
        ]
      );

      const coupon = coupons[0];

      if (coupon && coupon.isActive) {
        const now = new Date();
        const startsAt = coupon.startsAt ? new Date(coupon.startsAt) : null;
        const expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt) : null;
        const isValid =
          (!startsAt || now >= startsAt) &&
          (!expiresAt || now <= expiresAt) &&
          (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
          (!coupon.minOrderAmount || subtotal >= Number(coupon.minOrderAmount));

        if (isValid) {
          if (coupon.discountType === "PERCENTAGE") {
            discountAmount = subtotal * (Number(coupon.discountValue) / 100);
            if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
              discountAmount = Number(coupon.maxDiscount);
            }
          } else {
            discountAmount = Number(coupon.discountValue);
            if (discountAmount > subtotal) {
              discountAmount = subtotal;
            }
          }
        }
      }
    }

    const total = Math.max(0, subtotal + shippingFee + taxAmount - discountAmount);

    // Create Stripe payment intent
    const paymentIntent = await createPaymentIntent(total, "usd", {
      userId: auth.user.id,
      couponCode: couponCode || "",
    });

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: Math.round(total * 100) / 100,
        currency: "usd",
      },
    });
  } catch (error) {
    console.error("Payment intent creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
