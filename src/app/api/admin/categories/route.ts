import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { categorySchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { getCollection, getDocument, createDocument, updateDocument } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";

interface CategoryDoc extends FirestoreDocument {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
}

export async function GET() {
  try {
    await requireAdmin();

    const categories = await getCollection<CategoryDoc>("categories");
    const activeCategories = categories.filter((c) => !c.deleted);

    // Sort by order
    activeCategories.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Get product counts
    const products = await getCollection<FirestoreDocument>("products");
    const productCountMap = new Map<string, number>();
    for (const p of products) {
      const catId = p.categoryId as string;
      if (catId) {
        productCountMap.set(catId, (productCountMap.get(catId) || 0) + 1);
      }
    }

    const data = activeCategories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || null,
      image: category.image || null,
      parentId: category.parentId || null,
      parent: category.parentId ? activeCategories.find((c) => c.id === category.parentId) ? { id: category.parentId, name: activeCategories.find((c) => c.id === category.parentId)?.name, slug: activeCategories.find((c) => c.id === category.parentId)?.slug } : null : null,
      children: activeCategories.filter((c) => c.parentId === category.id).map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
      order: category.order || 0,
      isActive: category.isActive,
      productCount: productCountMap.get(category.id) || 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Admin categories fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();
    const validated = categorySchema.safeParse(body);

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

    const { name, description, image, parentId, isActive, order } = validated.data;

    // Check for duplicate name
    const existingCategories = await getCollection<CategoryDoc>("categories");
    const duplicate = existingCategories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase() && !c.deleted
    );

    if (duplicate) {
      return NextResponse.json(
        { success: false, error: "A category with this name already exists" },
        { status: 409 }
      );
    }

    // Generate slug
    let slug = slugify(name);

    // Ensure unique slug
    const slugExists = existingCategories.find(
      (c) => c.slug === slug && !c.deleted
    );
    if (slugExists) {
      slug = `${slug}-${Date.now()}`;
    }

    // Validate parent exists if provided
    if (parentId) {
      const parent = existingCategories.find((c) => c.id === parentId && !c.deleted);
      if (!parent) {
        return NextResponse.json(
          { success: false, error: "Parent category not found" },
          { status: 404 }
        );
      }
    }

    const category = await createDocument<CategoryDoc>("categories", {
      name,
      slug,
      description: description || null,
      image: image || null,
      parentId: parentId || null,
      isActive,
      order: order || 0,
    });

    // Log admin action
    await createDocument("adminLogs", {
      adminId: admin.id,
      action: "CREATE",
      entity: "Category",
      entityId: category.id,
      details: { categoryName: category.name, slug: category.slug },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...category,
          parent: parentId ? existingCategories.find((c) => c.id === parentId) ? { id: parentId, name: existingCategories.find((c) => c.id === parentId)?.name, slug: existingCategories.find((c) => c.id === parentId)?.slug } : null : null,
          children: [],
          productCount: 0,
        },
        message: "Category created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin category create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create category" },
      { status: 500 }
    );
  }
}
