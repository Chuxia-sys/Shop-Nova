import { NextResponse } from "next/server";
import { queryCollection, getCollection } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";

interface Category extends FirestoreDocument {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  parent?: { id: string; name: string; slug: string } | null;
  order: number;
  isActive: boolean;
  productCount?: number;
}

export async function GET() {
  try {
    const categories = await queryCollection<Category>(
      "categories",
      [{ field: "isActive", operator: "==", value: true }],
      "order",
      "asc"
    );

    // For each category, fetch parent if parentId exists
    const data = await Promise.all(
      categories.map(async (category) => {
        let parent: { id: string; name: string; slug: string } | null = null;
        if (category.parentId) {
          const allCats = await getCollection<Category>("categories");
          const found = allCats.find((c) => c.id === category.parentId);
          if (found) {
            parent = { id: found.id, name: found.name, slug: found.slug };
          }
        }

        // Count products in this category
        const products = await queryCollection<any>(
          "products",
          [
            { field: "categoryId", operator: "==", value: category.id },
            { field: "deleted", operator: "==", value: false },
          ]
        );

        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description || null,
          image: category.image || null,
          parentId: category.parentId || null,
          parent,
          order: category.order,
          isActive: category.isActive,
          productCount: products.length,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        };
      })
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Categories fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
