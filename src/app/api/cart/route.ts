import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { queryCollection, getDocument, createDocument, updateDocument, deleteDocument } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";
import { z } from "zod";

// Validation schemas
const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

const updateCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

const removeFromCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional().nullable(),
});

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
  compareAtPrice?: number | null;
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

interface ProductVariantDoc extends FirestoreDocument {
  name: string;
  price?: number | null;
  quantity: number;
  isActive: boolean;
}

export async function GET() {
  try {
    const auth = await getCurrentUser();
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      );
    }

    const cartItems = await queryCollection<CartItemDoc>(
      "cartItems",
      [
        { field: "userId", operator: "==", value: auth.user.id },
        { field: "deleted", operator: "==", value: false },
      ],
      "createdAt",
      "asc"
    );

    // Enrich with product data
    const data = await Promise.all(
      cartItems.map(async (item) => {
        const product = await getDocument<ProductDoc>("products", item.productId);
        if (!product || !product.isActive) return null;

        // Primary image
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

        // Variants
        let variants: ProductVariantDoc[] = [];
        if (item.variantId) {
          const variant = await getDocument<ProductVariantDoc>("productVariants", item.variantId);
          if (variant && variant.isActive) {
            variants = [variant];
          }
        }

        return {
          id: item.id,
          userId: item.userId,
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: Number(product.price),
            compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
            sku: product.sku,
            stock: product.quantity,
            isDigital: product.isDigital || false,
            image: images[0]?.url || null,
            imageAlt: images[0]?.altText || null,
            variants: [],
          },
        };
      })
    );

    // Filter out nulls (inactive products)
    const filtered = data.filter((item): item is NonNullable<typeof item> => item !== null);

    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    console.error("Cart fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cart items" },
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
    const validated = addToCartSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { productId, variantId, quantity } = validated.data;

    // Check if product exists and is active
    const product = await getDocument<ProductDoc>("products", productId);
    if (!product || !product.isActive) {
      return NextResponse.json(
        { success: false, error: "Product not found or unavailable" },
        { status: 404 }
      );
    }

    // Check stock availability
    if (variantId) {
      const variant = await getDocument<ProductVariantDoc>("productVariants", variantId);
      if (!variant || !variant.isActive) {
        return NextResponse.json(
          { success: false, error: "Variant not found or unavailable" },
          { status: 404 }
        );
      }
      if (variant.quantity < quantity) {
        return NextResponse.json(
          { success: false, error: "Insufficient stock for this variant" },
          { status: 400 }
        );
      }
    } else if (product.quantity < quantity) {
      return NextResponse.json(
        { success: false, error: "Insufficient stock" },
        { status: 400 }
      );
    }

    // Check if item already exists in cart (prevent duplicates — update qty instead)
    const existingItems = await queryCollection<CartItemDoc>(
      "cartItems",
      [
        { field: "userId", operator: "==", value: auth.user.id },
        { field: "productId", operator: "==", value: productId },
        { field: "variantId", operator: "==", value: variantId || null },
        { field: "deleted", operator: "==", value: false },
      ]
    );

    if (existingItems.length > 0) {
      const existing = existingItems[0];
      const updatedItem = await updateDocument<CartItemDoc>("cartItems", existing.id, {
        quantity: existing.quantity + quantity,
      });

      return NextResponse.json(
        { success: true, data: updatedItem, message: "Cart item quantity updated" },
        { status: 200 }
      );
    }

    // Add new item to cart
    const cartItem = await createDocument<CartItemDoc>("cartItems", {
      userId: auth.user.id,
      productId,
      variantId: variantId || null,
      quantity,
    });

    return NextResponse.json(
      { success: true, data: cartItem, message: "Item added to cart" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Cart add error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = updateCartSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { productId, variantId, quantity } = validated.data;

    // Find the cart item
    const cartItems = await queryCollection<CartItemDoc>(
      "cartItems",
      [
        { field: "userId", operator: "==", value: auth.user.id },
        { field: "productId", operator: "==", value: productId },
        { field: "variantId", operator: "==", value: variantId || null },
        { field: "deleted", operator: "==", value: false },
      ]
    );

    if (cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart item not found" },
        { status: 404 }
      );
    }

    const cartItem = cartItems[0];

    // Check stock availability
    if (variantId) {
      const variant = await getDocument<ProductVariantDoc>("productVariants", variantId);
      if (variant && variant.quantity < quantity) {
        return NextResponse.json(
          { success: false, error: "Insufficient stock for this variant" },
          { status: 400 }
        );
      }
    } else {
      const product = await getDocument<ProductDoc>("products", productId);
      if (product && product.quantity < quantity) {
        return NextResponse.json(
          { success: false, error: "Insufficient stock" },
          { status: 400 }
        );
      }
    }

    const updatedItem = await updateDocument<CartItemDoc>("cartItems", cartItem.id, {
      quantity,
    });

    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: "Cart item quantity updated",
    });
  } catch (error) {
    console.error("Cart update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update cart item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = removeFromCartSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { productId, variantId } = validated.data;

    // Find the cart item
    const cartItems = await queryCollection<CartItemDoc>(
      "cartItems",
      [
        { field: "userId", operator: "==", value: auth.user.id },
        { field: "productId", operator: "==", value: productId },
        { field: "variantId", operator: "==", value: variantId || null },
        { field: "deleted", operator: "==", value: false },
      ]
    );

    if (cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart item not found" },
        { status: 404 }
      );
    }

    await deleteDocument("cartItems", cartItems[0].id);

    return NextResponse.json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("Cart remove error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove item from cart" },
      { status: 500 }
    );
  }
}
