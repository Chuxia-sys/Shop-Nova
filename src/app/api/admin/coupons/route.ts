import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { couponSchema } from "@/lib/validations";
import { PAGINATION } from "@/lib/constants";
import { getCollection, getDocument, createDocument, updateDocument, softDelete } from "@/lib/firestore";
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

function generateCouponCode(length: number = 8): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive");
    const discountType = searchParams.get("discountType") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      PAGINATION.ADMIN_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("limit") || String(PAGINATION.ADMIN_PAGE_SIZE), 10))
    );

    let allCoupons = await getCollection<CouponDoc>("coupons");
    allCoupons = allCoupons.filter((c) => !c.deleted);

    if (search) {
      const lowerSearch = search.toLowerCase();
      allCoupons = allCoupons.filter(
        (c) =>
          (c.code || "").toLowerCase().includes(lowerSearch) ||
          (c.description || "").toLowerCase().includes(lowerSearch)
      );
    }

    if (isActive === "true") allCoupons = allCoupons.filter((c) => c.isActive);
    else if (isActive === "false") allCoupons = allCoupons.filter((c) => !c.isActive);

    if (discountType) {
      allCoupons = allCoupons.filter((c) => c.discountType === discountType);
    }

    // Sort by createdAt desc
    allCoupons.sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
      return bDate - aDate;
    });

    const totalCount = allCoupons.length;
    const startIdx = (page - 1) * limit;
    const paginatedCoupons = allCoupons.slice(startIdx, startIdx + limit);

    const data = paginatedCoupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description || null,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      usageLimit: coupon.usageLimit || null,
      usedCount: coupon.usedCount || 0,
      perUserLimit: coupon.perUserLimit,
      isActive: coupon.isActive,
      startsAt: coupon.startsAt || null,
      expiresAt: coupon.expiresAt || null,
      orderCount: 0,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Admin coupons fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();
    const validated = couponSchema.safeParse(body);

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

    let code = validated.data.code;

    if (!code || code.trim() === "") {
      code = generateCouponCode();
    } else {
      code = code.toUpperCase();
    }

    // Check for duplicate code
    const allCoupons = await getCollection<CouponDoc>("coupons");
    const existingCode = allCoupons.find((c) => c.code === code && !c.deleted);
    if (existingCode) {
      return NextResponse.json(
        { success: false, error: "A coupon with this code already exists" },
        { status: 409 }
      );
    }

    const coupon = await createDocument<CouponDoc>("coupons", {
      code,
      description: description || null,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || null,
      maxDiscount: maxDiscount || null,
      usageLimit: usageLimit || null,
      perUserLimit,
      usedCount: 0,
      isActive,
      startsAt: startsAt || null,
      expiresAt: expiresAt || null,
    });

    // Log admin action
    await createDocument("adminLogs", {
      adminId: admin.id,
      action: "CREATE",
      entity: "Coupon",
      entityId: coupon.id,
      details: { code: coupon.code, discountType, discountValue },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description || null,
          discountType: coupon.discountType,
          discountValue: Number(coupon.discountValue),
          minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
          maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
          usageLimit: coupon.usageLimit || null,
          usedCount: coupon.usedCount || 0,
          perUserLimit: coupon.perUserLimit,
          isActive: coupon.isActive,
          startsAt: coupon.startsAt || null,
          expiresAt: coupon.expiresAt || null,
          createdAt: coupon.createdAt,
          updatedAt: coupon.updatedAt,
        },
        message: "Coupon created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin coupon create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
