import { NextResponse } from "next/server";
import { queryCollection } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";

interface Brand extends FirestoreDocument {
  name: string;
  slug: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  productCount?: number;
}

export async function GET() {
  try {
    const brands = await queryCollection<Brand>(
      "brands",
      [{ field: "isActive", operator: "==", value: true }],
      "name",
      "asc"
    );

    // Count products per brand
    const data = await Promise.all(
      brands.map(async (brand) => {
        const products = await queryCollection<any>(
          "products",
          [
            { field: "brandId", operator: "==", value: brand.id },
            { field: "deleted", operator: "==", value: false },
          ]
        );

        return {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          logo: brand.logo || null,
          website: brand.website || null,
          isActive: brand.isActive,
          productCount: products.length,
          createdAt: brand.createdAt,
          updatedAt: brand.updatedAt,
        };
      })
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Brands fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}
