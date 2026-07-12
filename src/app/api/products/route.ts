import { NextRequest, NextResponse } from "next/server";
import { queryCollection, getDocument, getCollection } from "@/lib/firestore";
import type { FirestoreDocument, QueryFilter } from "@/lib/firestore";

interface ProductImage extends FirestoreDocument {
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
  productId: string;
}

interface ProductDoc extends FirestoreDocument {
  name: string;
  slug: string;
  description: string;
  excerpt?: string;
  price: number;
  compareAtPrice?: number | null;
  sku: string;
  quantity: number;
  isActive: boolean;
  isFeatured: boolean;
  isDigital?: boolean;
  categoryId: string;
  brandId?: string | null;
}

interface CategoryDoc extends FirestoreDocument {
  name: string;
  slug: string;
}

interface BrandDoc extends FirestoreDocument {
  name: string;
  slug: string;
  logo?: string;
}

interface ReviewDoc extends FirestoreDocument {
  productId: string;
  rating: number;
  isApproved: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const search = searchParams.get("search") || searchParams.get("q") || "";
    let categoryId = searchParams.get("categoryId") || "";
    let brandId = searchParams.get("brandId") || "";
    const categorySlug = searchParams.get("category") || "";
    const brandSlug = searchParams.get("brand") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const rating = searchParams.get("rating");
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const featured = searchParams.get("featured");
    const inStock = searchParams.get("inStock");
    const onSale = searchParams.get("onSale");

    // Build filters
    const filters: QueryFilter[] = [];

    filters.push({ field: "isActive", operator: "==", value: true });

    // Category filter
    if (categoryId) {
      filters.push({ field: "categoryId", operator: "==", value: categoryId });
    } else if (categorySlug) {
      // Resolve category slug to ID
      const { getCollection } = await import("@/lib/firestore");
      interface CategoryLookup extends FirestoreDocument { name: string; slug: string; }
      const allCats = await getCollection<CategoryLookup>("categories");
      const found = allCats.find((c) => c.slug === categorySlug);
      if (found) {
        categoryId = found.id;
        filters.push({ field: "categoryId", operator: "==", value: found.id });
      }
    }

    // Brand filter
    if (brandId) {
      filters.push({ field: "brandId", operator: "==", value: brandId });
    } else if (brandSlug) {
      // Resolve brand slug to ID
      const { getCollection } = await import("@/lib/firestore");
      interface BrandLookup extends FirestoreDocument { name: string; slug: string; }
      const allBrands = await getCollection<BrandLookup>("brands");
      const found = allBrands.find((b) => b.slug === brandSlug);
      if (found) {
        brandId = found.id;
        filters.push({ field: "brandId", operator: "==", value: found.id });
      }
    }

    // Price range filter
    if (minPrice) {
      filters.push({ field: "price", operator: ">=", value: parseFloat(minPrice) });
    }
    if (maxPrice) {
      filters.push({ field: "price", operator: "<=", value: parseFloat(maxPrice) });
    }

    // Featured filter
    if (featured === "true") {
      filters.push({ field: "isFeatured", operator: "==", value: true });
    }

    // In-stock filter
    if (inStock === "true") {
      filters.push({ field: "quantity", operator: ">", value: 0 });
    }

    // On-sale filter — use in-memory filtering instead of Firestore query
    // Firestore cannot efficiently query for documents where a field is not null,
    // so we filter in-memory after fetching.
    let applyOnSaleFilter = false;
    if (onSale === "true") {
      applyOnSaleFilter = true;
    }

    // Text search - use name prefix matching via searchCollection
    let productIds: string[] | null = null;
    if (search) {
      const { searchCollection } = await import("@/lib/firestore");
      const searchResults = await searchCollection<ProductDoc>(
        "products",
        "name",
        search.toLowerCase(),
        200
      );
      productIds = searchResults.map((p) => p.id);
      if (productIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        });
      }
    }

    // Determine order direction
    let orderByField = "createdAt";
    let orderDirection: "asc" | "desc" = "desc";
    switch (sort) {
      case "price-asc":
        orderByField = "price";
        orderDirection = "asc";
        break;
      case "price-desc":
        orderByField = "price";
        orderDirection = "desc";
        break;
      case "rating":
        orderByField = "createdAt";
        orderDirection = "desc";
        break;
      case "popular":
        orderByField = "createdAt";
        orderDirection = "desc";
        break;
      case "newest":
      default:
        orderByField = "createdAt";
        orderDirection = "desc";
        break;
    }

    // Fetch products
    const allProducts = await queryCollection<ProductDoc>(
      "products",
      filters,
      orderByField,
      orderDirection
    );

    // Filter by search results if needed
    let filteredProducts = allProducts;
    if (productIds) {
      const idSet = new Set(productIds);
      filteredProducts = allProducts.filter((p) => idSet.has(p.id));
    }

    // Enrich products with images, category, brand, and reviews
    let enriched = await Promise.all(
      filteredProducts.map(async (product) => {
        // Primary image
        const images = await queryCollection<ProductImage>(
          "productImages",
          [
            { field: "productId", operator: "==", value: product.id },
            { field: "isPrimary", operator: "==", value: true },
          ],
          "order",
          "asc",
          1
        );

        // Category
        let category: CategoryDoc | null = null;
        if (product.categoryId) {
          category = await getDocument<CategoryDoc>("categories", product.categoryId);
        }

        // Brand
        let brand: BrandDoc | null = null;
        if (product.brandId) {
          brand = await getDocument<BrandDoc>("brands", product.brandId);
        }

        // Reviews (for rating calculation)
        const reviews = await queryCollection<ReviewDoc>(
          "reviews",
          [
            { field: "productId", operator: "==", value: product.id },
            { field: "isApproved", operator: "==", value: true },
            { field: "deleted", operator: "==", value: false },
          ]
        );

        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          excerpt: product.excerpt || null,
          price: Number(product.price),
          compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
          sku: product.sku,
          quantity: product.quantity,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          categoryId: product.categoryId,
          brandId: product.brandId || null,
          images: images.map((img) => ({
            id: img.id,
            url: img.url,
            altText: img.altText || null,
            isPrimary: img.isPrimary,
          })),
          category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
          brand: brand ? { id: brand.id, name: brand.name, slug: brand.slug, logo: brand.logo || null } : null,
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          reviews: [],
        };
      })
    );

    // Apply rating filter in memory
    if (rating) {
      const minRating = parseInt(rating, 10);
      enriched = enriched.filter((p) => p.averageRating >= minRating);
    }

    // Apply on-sale filter in memory (compareAtPrice > price)
    if (applyOnSaleFilter) {
      enriched = enriched.filter((p) => {
        if (!p.compareAtPrice) return false;
        return p.compareAtPrice > p.price;
      });
    }

    // Sort by rating if requested
    if (sort === "rating") {
      enriched.sort((a, b) => b.averageRating - a.averageRating);
    }

    // Paginate
    const total = enriched.length;
    const totalPages = Math.ceil(total / limit);
    const startIdx = (page - 1) * limit;
    const paginatedData = enriched.slice(startIdx, startIdx + limit);

    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
