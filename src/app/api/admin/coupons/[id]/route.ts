import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { couponSchema } from "@/lib/validations";
import { getDocument, getCollection, updateDocument, createDocument, softDelete } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";

interface CouponDoc extends FirestoreDocument {
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  perUserLimit: number;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
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

    const existingCoupon = await getDocument<CouponDoc>("coupons", id);
    if (!existingCoupon || existingCoupon.deleted) {
      return NextResponse.json(
        { success: false, error: "Coupon not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = couponSchema.partial().safeParse(body);

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
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      perUserLimit,
      isActive,
      startsAt,
      expiresAt,
    } = validated.data;

    const updateData: Record<string, unknown> = {};

    if (code !== undefined) {
      const normalizedCode = code.toUpperCase();
      if (normalizedCode !== existingCoupon.code) {
        const allCoupons = await getCollection<CouponDoc>("coupons");
        const duplicate = allCoupons.find((c) => c.code === normalizedCode && c.id !== id && !c.deleted);
        if (duplicate) {
          return NextResponse.json(
            { success: false, error: "A coupon with this code already exists" },
            { status: 409 }
          );
        }
        updateData.code = normalizedCode;
      }
    }

    if (description !== undefined) updateData.description = description;
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = discountValue;
    if (minOrderAmount !== undefined) updateData.minOrderAmount = minOrderAmount;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
    if (perUserLimit !== undefined) updateData.perUserLimit = perUserLimit;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (startsAt !== undefined) updateData.startsAt = startsAt || null;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt || null;

    await updateDocument("coupons", id, updateData);

    // Log admin action
    await createDocument("adminLogs", {
      adminId: admin.id,
      action: "UPDATE",
      entity: "Coupon",
      entityId: id,
      details: { updatedFields: Object.keys(updateData) },
    });

    const updatedCoupon = await getDocument<CouponDoc>("coupons", id);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedCoupon?.id,
        code: updatedCoupon?.code,
        description: updatedCoupon?.description || null,
        discountType: updatedCoupon?.discountType,
        discountValue: updatedCoupon ? Number(updatedCoupon.discountValue) : 0,
        minOrderAmount: updatedCoupon?.minOrderAmount ? Number(updatedCoupon.minOrderAmount) : null,
        maxDiscount: updatedCoupon?.maxDiscount ? Number(updatedCoupon.maxDiscount) : null,
        usageLimit: updatedCoupon?.usageLimit || null,
        usedCount: updatedCoupon?.usedCount || 0,
        perUserLimit: updatedCoupon?.perUserLimit,
        isActive: updatedCoupon?.isActive,
        startsAt: updatedCoupon?.startsAt || null,
        expiresAt: updatedCoupon?.expiresAt || null,
        createdAt: updatedCoupon?.createdAt,
        updatedAt: updatedCoupon?.updatedAt,
      },
      message: "Coupon updated successfully",
    });
  } catch (error) {
    console.error("Admin coupon update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update coupon" },
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

    const existingCoupon = await getDocument<CouponDoc>("coupons", id);
    if (!existingCoupon || existingCoupon.deleted) {
      return NextResponse.json(
        { success: false, error: "Coupon not found" },
        { status: 404 }
      );
    }

    await softDelete("coupons", id, admin.id);

    // Log admin action
    await createDocument("adminLogs", {
      adminId: admin.id,
      action: "DELETE",
      entity: "Coupon",
      entityId: id,
      details: { code: existingCoupon.code },
    });

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Admin coupon delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
