import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { categorySchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { getDocument, getCollection, updateDocument, createDocument, softDelete } from "@/lib/firestore";
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const existingCategory = await getDocument<CategoryDoc>("categories", id);
    if (!existingCategory || existingCategory.deleted) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = categorySchema.partial().safeParse(body);

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

    const updateData: Record<string, unknown> = {};
    const allCategories = await getCollection<CategoryDoc>("categories");
    const activeCategories = allCategories.filter((c) => !c.deleted);

    // Handle name change with slug regeneration
    if (name !== undefined && name !== existingCategory.name) {
      const duplicate = activeCategories.find((c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== id);
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: "A category with this name already exists" },
          { status: 409 }
        );
      }
      updateData.name = name;
      let slug = slugify(name);
      const existingSlug = activeCategories.find((c) => c.slug === slug && c.id !== id);
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }
      updateData.slug = slug;
    }

    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image || null;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Handle parentId
    if (parentId !== undefined) {
      if (parentId === null) {
        updateData.parentId = null;
      } else {
        if (parentId === id) {
          return NextResponse.json(
            { success: false, error: "A category cannot be its own parent" },
            { status: 400 }
          );
        }

        const parent = activeCategories.find((c) => c.id === parentId);
        if (!parent) {
          return NextResponse.json(
            { success: false, error: "Parent category not found" },
            { status: 404 }
          );
        }

        // Check circular reference
        const descendants = activeCategories.filter((c) => c.parentId === id);
        if (descendants.some((d) => d.id === parentId)) {
          return NextResponse.json(
            { success: false, error: "Circular reference: parent cannot be a descendant" },
            { status: 400 }
          );
        }

        updateData.parentId = parentId;
      }
    }

    await updateDocument("categories", id, updateData);

    // Log admin action
    await createDocument("adminLogs", {
      adminId: admin.id,
      action: "UPDATE",
      entity: "Category",
      entityId: id,
      details: { updatedFields: Object.keys(updateData) },
    });

    // Fetch updated category
    const updatedCategory = await getDocument<CategoryDoc>("categories", id);
    const parent = updatedCategory?.parentId
      ? activeCategories.find((c) => c.id === updatedCategory.parentId)
      : null;
    const children = activeCategories.filter((c) => c.parentId === id);
    const products = await getCollection<FirestoreDocument>("products");
    const productCount = products.filter((p) => !p.deleted && (p as any).categoryId === id).length;

    return NextResponse.json({
      success: true,
      data: {
        id: updatedCategory?.id,
        name: updatedCategory?.name,
        slug: updatedCategory?.slug,
        description: updatedCategory?.description || null,
        image: updatedCategory?.image || null,
        parentId: updatedCategory?.parentId || null,
        parent: parent ? { id: parent.id, name: parent.name, slug: parent.slug } : null,
        children: children.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
        order: updatedCategory?.order || 0,
        isActive: updatedCategory?.isActive,
        productCount,
        createdAt: updatedCategory?.createdAt,
        updatedAt: updatedCategory?.updatedAt,
      },
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Admin category update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update category" },
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

    const existingCategory = await getDocument<CategoryDoc>("categories", id);
    if (!existingCategory || existingCategory.deleted) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if category has products
    const products = await getCollection<FirestoreDocument>("products");
    const categoryProducts = products.filter((p) => !p.deleted && (p as any).categoryId === id);

    if (categoryProducts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category "${existingCategory.name}" because it has ${categoryProducts.length} product(s). Reassign or delete the products first.`,
          details: {
            productCount: categoryProducts.length,
          },
        },
        { status: 409 }
      );
    }

    // Check if category has subcategories
    const allCategories = await getCollection<CategoryDoc>("categories");
    const children = allCategories.filter((c) => !c.deleted && c.parentId === id);

    if (children.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category "${existingCategory.name}" because it has ${children.length} subcategor(ies). Delete or reassign them first.`,
          details: {
            productCount: categoryProducts.length,
            childCount: children.length,
          },
        },
        { status: 409 }
      );
    }

    await softDelete("categories", id, admin.id);

    // Log admin action
    await createDocument("adminLogs", {
      adminId: admin.id,
      action: "DELETE",
      entity: "Category",
      entityId: id,
      details: { categoryName: existingCategory.name },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Admin category delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
