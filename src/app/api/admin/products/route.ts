import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { queryCollection, getDocument, createDocument, updateDocument } from "@/lib/firestore";
import type { FirestoreDocument, QueryFilter } from "@/lib/firestore";
import { productSchema } from "@/lib/validations";
import { slugify, generateSKU } from "@/lib/utils";

interface ProductDoc extends FirestoreDocument {
  name: string;
  slug: string;
  description: string;
  excerpt?: string | null;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  sku: string;
  barcode?: string | null;
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
  metaTitle?: string | null;
  metaDescription?: string | null;
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

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const brandId = searchParams.get("brandId") || "";
    const isActive = searchParams.get("isActive");
    const isFeatured = searchParams.get("isFeatured");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const sort = searchParams.get("sort") || "newest";

    const filters: QueryFilter[] = [{ field: "deleted", operator: "==", value: false }];

    if (search) {
      // For admin, search by name or SKU using prefix match
      const searchResults = await queryCollection<ProductDoc>(
        "products",
        [
          { field: "name", operator: ">=", value: search.toLowerCase() },
          { field: "name", operator: "<=", value: search.toLowerCase() + "\uf8ff" },
          { field: "deleted", operator: "==", value: false },
        ]
      );
      const productIds = searchResults.map((p) => p.id);
      if (productIds.length === 0) return NextResponse.json({ success: true, data: [], pagination: { page, limit, totalCount: 0, totalPages: 0 } });
      // We'll filter later
    }

    if (categoryId) filters.push({ field: "categoryId", operator: "==", value: categoryId });
    if (brandId) filters.push({ field: "brandId", operator: "==", value: brandId });
    if (isActive === "true") filters.push({ field: "isActive", operator: "==", value: true });
    else if (isActive === "false") filters.push({ field: "isActive", operator: "==", value: false });
    if (isFeatured === "true") filters.push({ field: "isFeatured", operator: "==", value: true });

    let orderByField = "createdAt";
    let orderDirection: "asc" | "desc" = "desc";
    switch (sort) {
      case "name-asc": orderByField = "name"; orderDirection = "asc"; break;
      case "name-desc": orderByField = "name"; orderDirection = "desc"; break;
      case "price-asc": orderByField = "price"; orderDirection = "asc"; break;
      case "price-desc": orderByField = "price"; orderDirection = "desc"; break;
      case "oldest": orderByField = "createdAt"; orderDirection = "asc"; break;
      default: orderByField = "createdAt"; orderDirection = "desc"; break;
    }

    const allProducts = await queryCollection<ProductDoc>("products", filters, orderByField, orderDirection);

    // Paginate
    const totalCount = allProducts.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIdx = (page - 1) * limit;
    const paginatedProducts = allProducts.slice(startIdx, startIdx + limit);

    const data = await Promise.all(
      paginatedProducts.map(async (product) => {
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

        let category: CategoryDoc | null = null;
        if (product.categoryId) category = await getDocument<CategoryDoc>("categories", product.categoryId);

        let brand: BrandDoc | null = null;
        if (product.brandId) brand = await getDocument<BrandDoc>("brands", product.brandId);

        const reviews = await queryCollection<any>("reviews", [{ field: "productId", operator: "==", value: product.id }, { field: "deleted", operator: "==", value: false }]);
        const orderItems = await queryCollection<any>("orderItems", [{ field: "productId", operator: "==", value: product.id }, { field: "deleted", operator: "==", value: false }]);

        return {
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
          category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
          brand: brand ? { id: brand.id, name: brand.name, slug: brand.slug, logo: brand.logo || null } : null,
          primaryImage: images[0] || null,
          reviewCount: reviews.length,
          orderCount: orderItems.length,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, totalCount, totalPages },
    });
  } catch (error) {
    console.error("Admin products fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();
    const validated = productSchema.safeParse(body);

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
      name, description, excerpt, price, compareAtPrice, costPrice, sku, barcode,
      quantity, isActive, isFeatured, isDigital, weight, length, width, height,
      categoryId, brandId, metaTitle, metaDescription, images, variants,
    } = validated.data;

    // Generate slug
    let slug = slugify(name);
    const existingSlug = await queryCollection<ProductDoc>("products", [{ field: "slug", operator: "==", value: slug }, { field: "deleted", operator: "==", value: false }]);
    if (existingSlug.length > 0) slug = `${slug}-${Date.now()}`;

    // Generate SKU if not provided
    const category = await getDocument<CategoryDoc>("categories", categoryId);
    const finalSku = sku || generateSKU(category?.name || "GEN", name, 1);

    const existingSku = await queryCollection<ProductDoc>("products", [{ field: "sku", operator: "==", value: finalSku }, { field: "deleted", operator: "==", value: false }]);
    if (existingSku.length > 0) {
      return NextResponse.json({ success: false, error: "A product with this SKU already exists" }, { status: 409 });
    }

    // Create the product
    const product = await createDocument<ProductDoc>("products", {
      name, slug, description,
      excerpt: excerpt || null,
      price, compareAtPrice: compareAtPrice || null, costPrice: costPrice || null,
      sku: finalSku, barcode: barcode || null, quantity,
      reservedQuantity: 0,
      isActive, isFeatured, isDigital: isDigital || false,
      weight: weight || null, length: length || null, width: width || null, height: height || null,
      categoryId, brandId: brandId || null,
      metaTitle: metaTitle || null, metaDescription: metaDescription || null,
    });

    // Create images
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        await createDocument<ProductImageDoc>("productImages", {
          url: img.url, altText: img.altText || null,
          isPrimary: img.isPrimary, order: i,
          productId: product.id,
        });
      }
    }

    // Create variants
    if (variants && variants.length > 0) {
      for (const v of variants) {
        await createDocument<ProductVariantDoc>("productVariants", {
          name: v.name, sku: v.sku || null, price: v.price || null,
          quantity: v.quantity, options: v.options || null, isActive: true,
          productId: product.id,
        });
      }
    }

    // Fetch created data
    const createdImages = await queryCollection<ProductImageDoc>("productImages", [{ field: "productId", operator: "==", value: product.id }]);
    const createdVariants = await queryCollection<ProductVariantDoc>("productVariants", [{ field: "productId", operator: "==", value: product.id }, { field: "isActive", operator: "==", value: true }]);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...product,
          price: Number(product.price),
          compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
          costPrice: product.costPrice ? Number(product.costPrice) : null,
          weight: product.weight ? Number(product.weight) : null,
          images: createdImages,
          variants: createdVariants.map((v) => ({ ...v, price: v.price ? Number(v.price) : null })),
        },
        message: "Product created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin product create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
