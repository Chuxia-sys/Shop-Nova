import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDocument, updateDocument, createDocument } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateStockSchema = z.object({
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative"),
});

interface ProductDoc extends FirestoreDocument {
  name: string;
  sku: string;
  quantity: number;
  reservedQuantity?: number;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const existingProduct = await getDocument<ProductDoc>("products", id);

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateStockSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { quantity } = validated.data;
    const reservedQty = existingProduct.reservedQuantity || 0;

    // Ensure we don't reduce quantity below reserved amount
    if (quantity < reservedQty) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot set quantity below reserved quantity (${reservedQty}). ${reservedQty} unit(s) are reserved for pending orders.`,
        },
        { status: 400 }
      );
    }

    const previousQuantity = existingProduct.quantity;

    const updatedProduct = await updateDocument<ProductDoc>("products", id, {
      quantity,
    });

    // Log admin action
    await createDocument("adminLogs", {
      adminId: admin.id,
      action: "UPDATE_STOCK",
      entity: "Product",
      entityId: id,
      details: {
        productName: existingProduct.name,
        previousQuantity,
        newQuantity: quantity,
        change: quantity - previousQuantity,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        sku: updatedProduct.sku,
        quantity: updatedProduct.quantity,
        reservedQuantity: reservedQty,
        availableQuantity: Math.max(0, (updatedProduct.quantity || 0) - reservedQty),
      },
      message: "Stock updated successfully",
    });
  } catch (error) {
    console.error("Admin inventory update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update stock" },
      { status: 500 }
    );
  }
}
