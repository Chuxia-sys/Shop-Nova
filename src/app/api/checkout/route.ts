import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { queryCollection, getDocument } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";
import { createPaymentIntent } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validations";
import { generateOrderNumber, formatPrice } from "@/lib/utils";
import {
  SHIPPING_FEE,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/constants";

const TAX_RATE = parseFloat(process.env.TAX_RATE || "0.08");

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
  isDefault?: boolean;
}

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

interface ProductImageDoc extends FirestoreDocument {
  url: string;
  productId: string;
  isPrimary: boolean;
}

interface CouponDoc extends FirestoreDocument {
  code: string;
  description?: string;
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

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentUser();
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = checkoutSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { addressId, couponCode, notes } = validated.data;

    // Validate shipping address
    const address = await getDocument<AddressDoc>("addresses", addressId);
    if (!address || address.userId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Shipping address not found" },
        { status: 404 }
      );
    }

    // Fetch cart items with product details
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

    // Validate stock and active status
    const enrichedCartItems = await Promise.all(
      cartItems.map(async (item) => {
        const product = await getDocument<ProductDoc>("products", item.productId);
        if (!product) return null;

        const images = await queryCollection<ProductImageDoc>(
          "productImages",
          [
            { field: "productId", operator: "==", value: item.productId },
            { field: "isPrimary", operator: "==", value: true },
          ],
          "order",
          "asc",
          1
        );

        return { ...item, product, image: images[0]?.url || null };
      })
    );

    const validItems = enrichedCartItems.filter((item): item is NonNullable<typeof item> => item !== null);

    for (const item of validItems) {
      if (!item.product.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: `"${item.product.name}" is no longer available`,
          },
          { status: 400 }
        );
      }

      if (item.product.quantity < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for "${item.product.name}"`,
          },
          { status: 400 }
        );
      }
    }

    // Calculate subtotal
    const subtotal = validItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    // Calculate shipping
    const shippingFee =
      subtotal >= FREE_SHIPPING_THRESHOLD ||
      validItems.every((item) => item.product.isDigital)
        ? 0
        : SHIPPING_FEE;

    // Calculate tax
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
      if (!coupon) {
        return NextResponse.json(
          { success: false, error: "Invalid coupon code" },
          { status: 400 }
        );
      }

      if (!coupon.isActive) {
        return NextResponse.json(
          { success: false, error: "Coupon is no longer active" },
          { status: 400 }
        );
      }

      const now = new Date();
      if (coupon.startsAt && now < new Date(coupon.startsAt)) {
        return NextResponse.json(
          { success: false, error: "Coupon is not yet valid" },
          { status: 400 }
        );
      }
      if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
        return NextResponse.json(
          { success: false, error: "Coupon has expired" },
          { status: 400 }
        );
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json(
          { success: false, error: "Coupon usage limit reached" },
          { status: 400 }
        );
      }

      if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
        return NextResponse.json(
          {
            success: false,
            error: `Minimum order amount of ${formatPrice(Number(coupon.minOrderAmount))} required for this coupon`,
          },
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
        return NextResponse.json(
          {
            success: false,
            error: "Coupon usage limit reached for this account",
          },
          { status: 400 }
        );
      }

      // Calculate discount
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

    const total = Math.max(0, subtotal + shippingFee + taxAmount - discountAmount);

    // Generate order number for metadata
    const orderNumber = generateOrderNumber();

    // Create Stripe payment intent
    const paymentIntent = await createPaymentIntent(
      total,
      "usd",
      {
        userId: auth.user.id,
        orderNumber,
        addressId,
        notes: notes || "",
        couponCode: couponCode || "",
      }
    );

    // Build order summary for response
    const orderSummary = {
      orderNumber,
      subtotal: Math.round(subtotal * 100) / 100,
      shippingFee: Math.round(shippingFee * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      currency: "USD",
      items: validItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        price: Number(item.product.price),
        quantity: item.quantity,
        total: Number(item.product.price) * item.quantity,
        image: item.image,
      })),
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        street: address.street,
        apartment: address.apartment || null,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderSummary,
      },
    });
  } catch (error) {
    console.error("Checkout initialization error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize checkout" },
      { status: 500 }
    );
  }
}
