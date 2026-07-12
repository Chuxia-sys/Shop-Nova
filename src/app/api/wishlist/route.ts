import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDocument, queryCollection, createDocument, deleteDocument } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";
import { z } from "zod";

const addToWishlistSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

const removeFromWishlistSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

interface WishlistItemDoc extends FirestoreDocument {
  userId: string;
  productId: string;
}

interface ProductDoc extends FirestoreDocument {
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  excerpt?: string;
  isActive: boolean;
}

interface ProductImageDoc extends FirestoreDocument {
  url: string;
  altText?: string;
  isPrimary: boolean;
  productId: string;
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

    const wishlistItems = await queryCollection<WishlistItemDoc>(
      "wishlistItems",
      [
        { field: "userId", operator: "==", value: auth.user.id },
        { field: "deleted", operator: "==", value: false },
      ],
      "createdAt",
      "desc"
    );

    // Enrich with product data and filter out inactive products
    const data = await Promise.all(
      wishlistItems.map(async (item) => {
        const product = await getDocument<ProductDoc>("products", item.productId);
        if (!product || !product.isActive) return null;

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

        return {
          id: item.id,
          productId: item.productId,
          createdAt: item.createdAt,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: Number(product.price),
            compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
            excerpt: product.excerpt || null,
            image: images[0]?.url || null,
            imageAlt: images[0]?.altText || null,
          },
        };
      })
    );

    // Filter out nulls (inactive products)
    const filtered = data.filter((item): item is NonNullable<typeof item> => item !== null);

    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    console.error("Wishlist fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wishlist items" },
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
    const validated = addToWishlistSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { productId } = validated.data;

    // Check if product exists and is active
    const product = await getDocument<ProductDoc>("products", productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    if (!product.isActive) {
      return NextResponse.json(
        { success: false, error: "Product is not available" },
        { status: 400 }
      );
    }

    // Check if already in wishlist (prevent duplicates)
    const existingItems = await queryCollection<WishlistItemDoc>(
      "wishlistItems",
      [
        { field: "userId", operator: "==", value: auth.user.id },
        { field: "productId", operator: "==", value: productId },
        { field: "deleted", operator: "==", value: false },
      ]
    );

    if (existingItems.length > 0) {
      return NextResponse.json(
        { success: true, data: existingItems[0], message: "Item already in wishlist" },
        { status: 200 }
      );
    }

    // Add to wishlist
    const wishlistItem = await createDocument<WishlistItemDoc>("wishlistItems", {
      userId: auth.user.id,
      productId,
    });

    return NextResponse.json(
      { success: true, data: wishlistItem, message: "Item added to wishlist" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Wishlist add error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add item to wishlist" },
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
    const validated = removeFromWishlistSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { productId } = validated.data;

    // Find the wishlist item
    const existingItems = await queryCollection<WishlistItemDoc>(
      "wishlistItems",
      [
        { field: "userId", operator: "==", value: auth.user.id },
        { field: "productId", operator: "==", value: productId },
        { field: "deleted", operator: "==", value: false },
      ]
    );

    if (existingItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Wishlist item not found" },
        { status: 404 }
      );
    }

    await deleteDocument("wishlistItems", existingItems[0].id);

    return NextResponse.json({
      success: true,
      message: "Item removed from wishlist",
    });
  } catch (error) {
    console.error("Wishlist remove error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove item from wishlist" },
      { status: 500 }
    );
  }
}
