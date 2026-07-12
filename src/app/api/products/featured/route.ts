import { NextResponse } from "next/server";
import { queryCollection, getDocument } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";

interface ProductImage extends FirestoreDocument {
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
}

interface ReviewDoc extends FirestoreDocument {
  rating: number;
}

interface Product extends FirestoreDocument {
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
  categoryId: string;
  brandId?: string | null;
  images?: ProductImage[];
  reviews?: { rating: number }[];
}

interface Category extends FirestoreDocument {
  name: string;
  slug: string;
}

interface Brand extends FirestoreDocument {
  name: string;
  slug: string;
  logo?: string;
}

export async function GET() {
  try {
    const products = await queryCollection<ProductWithReviews>(
      "products",
      [
        { field: "isFeatured", operator: "==", value: true },
        { field: "isActive", operator: "==", value: true },
      ],
      "createdAt",
      "desc",
      8
    );

    const processedProducts = await Promise.all(
      products.map(async (product) => {
        // Fetch primary image
        const allImages = await queryCollection<ProductImage>(
          "productImages",
          [
            { field: "productId", operator: "==", value: product.id },
            { field: "isPrimary", operator: "==", value: true },
          ],
          "order",
          "asc",
          1
        );

        // Fetch category
        let category: Category | null = null;
        if (product.categoryId) {
          category = await getDocument<Category>("categories", product.categoryId);
        }

        // Fetch brand
        let brand: Brand | null = null;
        if (product.brandId) {
          brand = await getDocument<Brand>("brands", product.brandId);
        }

        // Fetch reviews
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
          images: allImages.map((img) => ({
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

    return NextResponse.json({ success: true, data: processedProducts });
  } catch (error) {
    console.error("Featured products fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch featured products" },
      { status: 500 }
    );
  }
}

interface ProductWithReviews extends Product {
  reviews?: { rating: number }[];
}
