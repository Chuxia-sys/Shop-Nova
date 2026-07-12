import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { PAGINATION } from "@/lib/constants";
import { getCollection, queryCollection, getDocument } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";

interface ProductDoc extends FirestoreDocument {
  name: string;
  slug: string;
  sku: string;
  barcode?: string;
  quantity: number;
  reservedQuantity?: number;
  isActive: boolean;
  price: number;
  categoryId: string;
}

interface ProductImageDoc extends FirestoreDocument {
  url: string;
  altText?: string;
  isPrimary: boolean;
  productId: string;
}

interface CategoryDoc extends FirestoreDocument {
  id: string;
  name: string;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const lowStock = searchParams.get("lowStock");
    const lowStockThreshold = parseInt(searchParams.get("threshold") || "10", 10);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      PAGINATION.ADMIN_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("limit") || String(PAGINATION.ADMIN_PAGE_SIZE), 10))
    );
    const sort = searchParams.get("sort") || "name-asc";

    let allProducts = await getCollection<ProductDoc>("products");
    allProducts = allProducts.filter((p) => !p.deleted);

    // Search by name or SKU
    if (search) {
      const lowerSearch = search.toLowerCase();
      allProducts = allProducts.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(lowerSearch) ||
          (p.sku || "").toLowerCase().includes(lowerSearch)
      );
    }

    // Sort
    const sortField = sort.startsWith("name") ? "name" : sort.startsWith("sku") ? "sku" : sort.startsWith("quantity") ? "quantity" : "name";
    const sortDir = sort.endsWith("desc") ? -1 : 1;
    allProducts.sort((a, b) => {
      const aVal = (a[sortField as keyof ProductDoc] as string | number) || "";
      const bVal = (b[sortField as keyof ProductDoc] as string | number) || "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * sortDir;
      }
      return String(aVal).localeCompare(String(bVal)) * sortDir;
    });

    const totalCount = allProducts.length;
    const startIdx = (page - 1) * limit;
    const paginatedProducts = allProducts.slice(startIdx, startIdx + limit);

    const data = await Promise.all(
      paginatedProducts.map(async (product) => {
        const available = (product.quantity || 0) - (product.reservedQuantity || 0);

        const images = await queryCollection<ProductImageDoc>(
          "productImages",
          [
            { field: "productId", operator: "==", value: product.id },
            { field: "isPrimary", operator: "==", value: true },
          ],
          "order",
          "asc",
          1
        );

        let category: { id: string; name: string } | null = null;
        if (product.categoryId) {
          const cat = await getDocument<CategoryDoc>("categories", product.categoryId);
          if (cat) category = { id: cat.id, name: cat.name };
        }

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          barcode: product.barcode || null,
          quantity: product.quantity || 0,
          reservedQuantity: product.reservedQuantity || 0,
          availableQuantity: Math.max(0, available),
          isActive: product.isActive,
          price: Number(product.price || 0),
          image: images[0]?.url || null,
          category,
          isLowStock: available < lowStockThreshold,
        };
      })
    );

    const filteredData = lowStock === "true" ? data.filter((item) => item.isLowStock) : data;

    return NextResponse.json({
      success: true,
      data: filteredData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      lowStockThreshold,
    });
  } catch (error) {
    console.error("Admin inventory fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}
