import { NextRequest, NextResponse } from "next/server";
import { queryCollection, getDocument } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";

interface ProductImage extends FirestoreDocument {
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
  productId: string;
}

interface ProductVariant extends FirestoreDocument {
  name: string;
  sku?: string;
  price?: number | null;
  quantity: number;
  options?: unknown;
  isActive: boolean;
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
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  metaTitle?: string;
  metaDescription?: string;
}

interface CategoryDoc extends FirestoreDocument {
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

interface BrandDoc extends FirestoreDocument {
  name: string;
  slug: string;
  logo?: string;
  website?: string;
}

interface ReviewDoc extends FirestoreDocument {
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
  isApproved: boolean;
  userId: string;
}

interface UserDoc extends FirestoreDocument {
  name?: string;
  image?: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Product slug is required" },
        { status: 400 }
      );
    }

    // Find product by slug
    const products = await queryCollection<ProductDoc>(
      "products",
      [
        { field: "slug", operator: "==", value: slug },
        { field: "deleted", operator: "==", value: false },
      ]
    );

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const product = products[0];

    // Fetch images
    const images = await queryCollection<ProductImage>(
      "productImages",
      [
        { field: "productId", operator: "==", value: product.id },
        { field: "deleted", operator: "==", value: false },
      ],
      "order",
      "asc"
    );

    // Fetch variants
    const variants = await queryCollection<ProductVariant>(
      "productVariants",
      [
        { field: "productId", operator: "==", value: product.id },
        { field: "isActive", operator: "==", value: true },
        { field: "deleted", operator: "==", value: false },
      ]
    );

    // Fetch category
    let category: CategoryDoc | null = null;
    if (product.categoryId) {
      category = await getDocument<CategoryDoc>("categories", product.categoryId);
    }

    // Fetch brand
    let brand: BrandDoc | null = null;
    if (product.brandId) {
      brand = await getDocument<BrandDoc>("brands", product.brandId);
    }

    // Fetch reviews
    const reviews = await queryCollection<ReviewDoc>(
      "reviews",
      [
        { field: "productId", operator: "==", value: product.id },
        { field: "isApproved", operator: "==", value: true },
        { field: "deleted", operator: "==", value: false },
      ],
      "createdAt",
      "desc"
    );

    // Fetch user data for each review
    const reviewsWithUsers = await Promise.all(
      reviews.map(async (review) => {
        const user = review.userId
          ? await getDocument<UserDoc>("users", review.userId)
          : null;
        return {
          id: review.id,
          rating: review.rating,
          title: review.title || null,
          comment: review.comment || null,
          createdAt: review.createdAt,
          user: {
            name: user?.name || "Anonymous",
            image: user?.image || null,
          },
        };
      })
    );

    // Compute average rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    const productData = {
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
      isDigital: product.isDigital || false,
      categoryId: product.categoryId,
      brandId: product.brandId || null,
      weight: product.weight ? Number(product.weight) : null,
      metaTitle: product.metaTitle || null,
      metaDescription: product.metaDescription || null,
      images: images.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText || null,
        isPrimary: img.isPrimary,
        order: img.order,
      })),
      variants: variants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku || null,
        price: v.price ? Number(v.price) : null,
        quantity: v.quantity,
        options: v.options || null,
      })),
      category: category
        ? {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description || null,
            image: category.image || null,
          }
        : null,
      brand: brand
        ? {
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            logo: brand.logo || null,
            website: brand.website || null,
          }
        : null,
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
      reviews: reviewsWithUsers,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return NextResponse.json({ success: true, data: productData });
  } catch (error) {
    console.error("Product fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
