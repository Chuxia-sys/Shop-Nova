import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { getDocument, getCollection, queryCollection, updateDocument, createDocument, deleteDocument, batchWrite } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";

interface ProductDoc extends FirestoreDocument {
  name: string;
  slug: string;
  description: string;
  excerpt?: string;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  sku: string;
  barcode?: string;
  quantity: number;
  reservedQuantity?: number;
  isActive: boolean;
  isFeatured: boolean;
  isDigital?: boolean;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  categoryId: string;
  brandId?: string | null;
  metaTitle?: string;
  metaDescription?: string;
}

interface ProductImageDoc extends FirestoreDocument {
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
  productId: string;
}

interface ProductVariantDoc extends FirestoreDocument {
  name: string;
  sku?: string;
  price?: number | null;
  quantity: number;
  options?: unknown;
  isActive: boolean;
  productId: string;
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
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const product = await getDocument<ProductDoc>("products", id);
    if (!product || product.deleted) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const [images, variants, category, brand, reviews] = await Promise.all([
      queryCollection<ProductImageDoc>(
        "productImages",
        [
          { field: "productId", operator: "==", value: id },
          { field: "deleted", operator: "==", value: false },
        ],
        "order",
        "asc"
      ),
      queryCollection<ProductVariantDoc>(
        "productVariants",
        [
          { field: "productId", operator: "==", value: id },
          { field: "isActive", operator: "==", value: true },
          { field: "deleted", operator: "==", value: false },
        ]
      ),
      product.categoryId
        ? getDocument<CategoryDoc>("categories", product.categoryId)
        : Promise.resolve(null),
      product.brandId
        ? getDocument<BrandDoc>("brands", product.brandId)
        : Promise.resolve(null),
      queryCollection<ReviewDoc>(
        "reviews",
        [
          { field: "productId", operator: "==", value: id },
          { field: "deleted", operator: "==", value: false },
        ]
      ),
    ]);

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        excerpt: product.excerpt || null,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        costPrice: product.costPrice ? Number(product.costPrice) : null,
        sku: product.sku,
        barcode: product.barcode || null,
        quantity: product.quantity,
        reservedQuantity: product.reservedQuantity || 0,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        isDigital: product.isDigital || false,
        weight: product.weight ? Number(product.weight) : null,
        length: product.length ? Number(product.length) : null,
        width: product.width ? Number(product.width) : null,
        height: product.height ? Number(product.height) : null,
        categoryId: product.categoryId,
        brandId: product.brandId || null,
        metaTitle: product.metaTitle || null,
        metaDescription: product.metaDescription || null,
        category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
        brand: brand ? { id: brand.id, name: brand.name, slug: brand.slug, logo: brand.logo || null } : null,
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
          isActive: v.isActive,
          productId: v.productId,
        })),
        _count: {
          reviews: reviews.length,
          orderItems: 0,
          wishlistItems: 0,
        },
        reviewStats: {
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews: reviews.length,
        },
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    });
  } catch (error) {
    console.error("Admin product fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const existingProduct = await getDocument<ProductDoc>("products", id);
    if (!existingProduct || existingProduct.deleted) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = productSchema.partial().safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validated.error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      excerpt,
      price,
      compareAtPrice,
      costPrice,
      sku,
      barcode,
      quantity,
      isActive,
      isFeatured,
      isDigital,
      weight,
      length,
      width,
      height,
      categoryId,
      brandId,
      metaTitle,
      metaDescription,
      images: newImages,
      variants: newVariants,
    } = validated.data;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name = name;
      let slug = slugify(name);
      const allProducts = await getCollection<ProductDoc>("products");
      const existingSlug = allProducts.find((p) => p.slug === slug && p.id !== id && !p.deleted);
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }
      updateData.slug = slug;
    }

    if (description !== undefined) updateData.description = description;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (price !== undefined) updateData.price = price;
    if (compareAtPrice !== undefined) updateData.compareAtPrice = compareAtPrice;
    if (costPrice !== undefined) updateData.costPrice = costPrice;
    if (barcode !== undefined) updateData.barcode = barcode;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (isDigital !== undefined) updateData.isDigital = isDigital;
    if (weight !== undefined) updateData.weight = weight;
    if (length !== undefined) updateData.length = length;
    if (width !== undefined) updateData.width = width;
    if (height !== undefined) updateData.height = height;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (brandId !== undefined) updateData.brandId = brandId;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;

    // Handle SKU update with uniqueness check
    if (sku !== undefined && sku !== existingProduct.sku) {
      const allProducts = await getCollection<ProductDoc>("products");
      const existingSku = allProducts.find((p) => p.sku === sku && p.id !== id && !p.deleted);
      if (existingSku) {
        return NextResponse.json(
          { success: false, error: "A product with this SKU already exists" },
          { status: 409 }
        );
      }
      updateData.sku = sku;
    }

    // Update product
    await updateDocument("products", id, updateData);

    // Handle images if provided
    if (newImages !== undefined) {
      const existingImages = await queryCollection<ProductImageDoc>(
        "productImages",
        [
          { field: "productId", operator: "==", value: id },
          { field: "deleted", operator: "==", value: false },
        ]
      );

      // Delete existing images
      const deleteOps = existingImages.map((img) => ({
        type: "delete" as const,
        collection: "productImages",
        documentId: img.id,
      }));
      if (deleteOps.length > 0) {
        await batchWrite(deleteOps);
      }

      // Create new images
      for (let i = 0; i < newImages.length; i++) {
        const img = newImages[i];
        await createDocument("productImages", {
          productId: id,
          url: img.url,
          altText: img.altText || null,
          isPrimary: img.isPrimary || false,
          order: i,
        });
      }
    }

    // Handle variants if provided
    if (newVariants !== undefined) {
      const existingVariants = await queryCollection<ProductVariantDoc>(
        "productVariants",
        [
          { field: "productId", operator: "==", value: id },
          { field: "deleted", operator: "==", value: false },
        ]
      );

      // Soft delete existing variants
      for (const v of existingVariants) {
        await updateDocument("productVariants", v.id, { isActive: false, deleted: true });
      }

      // Create new variants
      for (const v of newVariants) {
        await createDocument("productVariants", {
          productId: id,
          name: v.name,
          sku: v.sku || null,
          price: v.price || null,
          quantity: v.quantity || 0,
          options: v.options || null,
          isActive: true,
        });
      }
    }

    // Log admin action
    await createDocument("adminLogs", {
      adminId: admin.id,
      action: "UPDATE",
      entity: "Product",
      entityId: id,
      details: { updatedFields: Object.keys(updateData) },
    });

    // Fetch updated product
    const updatedProduct = await getDocument<ProductDoc>("products", id);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedProduct?.id,
        name: updatedProduct?.name,
        slug: updatedProduct?.slug,
        sku: updatedProduct?.sku,
        price: updatedProduct ? Number(updatedProduct.price) : 0,
        isActive: updatedProduct?.isActive,
        isFeatured: updatedProduct?.isFeatured,
      },
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Admin product update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const existingProduct = await getDocument<ProductDoc>("products", id);
    if (!existingProduct || existingProduct.deleted) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Soft delete the product
    await updateDocument("products", id, {
      isActive: false,
      deleted: true,
    } as Partial<ProductDoc>);

    // Soft delete associated images
    const images = await queryCollection<ProductImageDoc>(
      "productImages",
      [
        { field: "productId", operator: "==", value: id },
        { field: "deleted", operator: "==", value: false },
      ]
    );
    for (const img of images) {
      await updateDocument("productImages", img.id, {
        deleted: true,
      } as Partial<ProductImageDoc>);
    }

    // Soft delete associated variants
    const variants = await queryCollection<ProductVariantDoc>(
      "productVariants",
      [
        { field: "productId", operator: "==", value: id },
        { field: "deleted", operator: "==", value: false },
      ]
    );
    for (const v of variants) {
      await updateDocument("productVariants", v.id, {
        isActive: false,
        deleted: true,
      } as Partial<ProductVariantDoc>);
    }

    // Log admin action
    await createDocument("adminLogs", {
      adminId: admin.id,
      action: "DELETE",
      entity: "Product",
      entityId: id,
      details: { productName: existingProduct.name, softDelete: true },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Admin product delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
