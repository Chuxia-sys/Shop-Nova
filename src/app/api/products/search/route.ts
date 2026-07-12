import { NextRequest, NextResponse } from "next/server";
import { searchCollection } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";

interface ProductSearchResult extends FirestoreDocument {
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  isActive: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const searchTerm = q.trim().toLowerCase();

    // Fetch active products for search
    const products = await searchCollection<ProductSearchResult>(
      "products",
      "name",
      searchTerm,
      10
    );

    // Filter for active products
    const activeProducts = products.filter((p) => p.isActive);

    // Get primary images for each product
    const results = await Promise.all(
      activeProducts.map(async (product) => {
        // Try to get primary image
        const { queryCollection } = await import("@/lib/firestore");
        const images = await queryCollection<any>(
          "productImages",
          [
            { field: "productId", operator: "==", value: product.id },
            { field: "isPrimary", operator: "==", value: true },
          ],
          "order",
          "asc",
          1
        );

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: Number(product.price),
          compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
          image: images[0]?.url || null,
          imageAlt: images[0]?.altText || null,
        };
      })
    );

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search products" },
      { status: 500 }
    );
  }
}
