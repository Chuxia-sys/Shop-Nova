import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { PAGINATION } from "@/lib/constants";
import { z } from "zod";
import { queryCollection, getDocument, updateDocument, createDocument, getCollection } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";

const updateUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["CUSTOMER", "ADMIN", "SUPER_ADMIN"]).optional(),
  isBanned: z.boolean().optional(),
  banReason: z.string().optional().nullable(),
});

interface UserDoc extends FirestoreDocument {
  name: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  image?: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  lastLoginAt?: string;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      PAGINATION.ADMIN_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("limit") || String(PAGINATION.ADMIN_PAGE_SIZE), 10))
    );
    const sort = searchParams.get("sort") || "newest";

    // Fetch all users from Firestore
    let allUsers = await getCollection<UserDoc>("users");

    // Filter out deleted
    allUsers = allUsers.filter((u) => !u.deleted);

    // Search by name or email
    if (search) {
      const lowerSearch = search.toLowerCase();
      allUsers = allUsers.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(lowerSearch) ||
          (u.email || "").toLowerCase().includes(lowerSearch)
      );
    }

    // Filter by role
    if (role) {
      allUsers = allUsers.filter((u) => u.role === role);
    }

    // Filter by status
    if (status === "active") {
      allUsers = allUsers.filter((u) => u.isActive && !u.isBanned);
    } else if (status === "banned") {
      allUsers = allUsers.filter((u) => u.isBanned);
    } else if (status === "inactive") {
      allUsers = allUsers.filter((u) => !u.isActive);
    }

    // Sort
    const sortField = sort === "name-asc" ? "name" : sort === "name-desc" ? "name" : "createdAt";
    const sortDir = sort === "name-desc" ? -1 : 1;
    allUsers.sort((a, b) => {
      const aVal = (a[sortField as keyof UserDoc] as string) || "";
      const bVal = (b[sortField as keyof UserDoc] as string) || "";
      return aVal > bVal ? sortDir : aVal < bVal ? -sortDir : 0;
    });

    // Paginate
    const totalCount = allUsers.length;
    const startIdx = (page - 1) * limit;
    const paginatedUsers = allUsers.slice(startIdx, startIdx + limit);

    // Get order counts for each user
    const allOrders = await getCollection<FirestoreDocument>("orders");
    const orderCountMap = new Map<string, number>();
    const spentMap = new Map<string, number>();
    for (const order of allOrders) {
      const uid = order.userId as string;
      if (uid) {
        orderCountMap.set(uid, (orderCountMap.get(uid) || 0) + 1);
        if (order.paymentStatus === "COMPLETED") {
          spentMap.set(uid, (spentMap.get(uid) || 0) + Number(order.total || 0));
        }
      }
    }

    const data = paginatedUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      phone: user.phone || null,
      image: user.image || null,
      role: user.role,
      isActive: user.isActive,
      isBanned: user.isBanned,
      banReason: user.banReason || null,
      lastLoginAt: user.lastLoginAt || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      totalOrders: orderCountMap.get(user.id) || 0,
      totalReviews: 0,
      totalSpent: spentMap.get(user.id) || 0,
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
    console.error("Admin users fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();
    const validated = updateUserSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { userId, role, isBanned, banReason } = validated.data;

    // Check user exists
    const targetUser = await getDocument<UserDoc>("users", userId);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent super admin from being modified by non-super admins
    if (targetUser.role === "SUPER_ADMIN" && admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "You cannot modify super admin users" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (role !== undefined) {
      // Prevent demoting self
      if (admin.id === userId) {
        return NextResponse.json(
          { success: false, error: "You cannot change your own role" },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    if (isBanned !== undefined) {
      // Prevent banning self
      if (admin.id === userId) {
        return NextResponse.json(
          { success: false, error: "You cannot ban yourself" },
          { status: 400 }
        );
      }
      updateData.isBanned = isBanned;
      updateData.isActive = !isBanned;
      if (isBanned) {
        updateData.banReason = banReason || null;
      } else {
        updateData.banReason = null;
      }
    }

    const updatedUser = await updateDocument<UserDoc>("users", userId, updateData);

    // Log admin action
    await createDocument("adminLogs", {
      adminId: admin.id,
      action: "UPDATE_USER",
      entity: "User",
      entityId: userId,
      details: {
        updatedFields: Object.keys(updateData),
        previousRole: targetUser.role,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}
