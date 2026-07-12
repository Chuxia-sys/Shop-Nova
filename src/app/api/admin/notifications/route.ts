import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { getCollection, createDocument, batchWrite } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";

const sendNotificationSchema = z.object({
  userIds: z.array(z.string()).min(1, "At least one user ID is required"),
  type: z.enum([
    "ORDER_CONFIRMED",
    "ORDER_SHIPPED",
    "ORDER_DELIVERED",
    "ORDER_CANCELLED",
    "PAYMENT_RECEIVED",
    "REFUND_PROCESSED",
    "WELCOME",
    "PROMOTION",
    "ADMIN_ALERT",
  ]),
  title: z.string().min(1, "Title is required").max(200),
  message: z.string().optional(),
  link: z.string().optional(),
});

interface UserDoc extends FirestoreDocument {
  isActive: boolean;
  isBanned: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();
    const validated = sendNotificationSchema.safeParse(body);

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

    const { userIds, type, title, message, link } = validated.data;

    let targetUserIds: string[];

    // Handle "all" users
    if (userIds.length === 1 && userIds[0] === "all") {
      const allUsers = await getCollection<UserDoc>("users");
      targetUserIds = allUsers
        .filter((u) => !u.deleted && u.isActive && !u.isBanned)
        .map((u) => u.id);

      if (targetUserIds.length === 0) {
        return NextResponse.json(
          { success: false, error: "No active users found to send notifications to" },
          { status: 404 }
        );
      }
    } else {
      // Verify all provided user IDs exist
      const allUsers = await getCollection<UserDoc>("users");
      const existingIds = new Set(allUsers.filter((u) => !u.deleted).map((u) => u.id));
      const missingIds = userIds.filter((id) => !existingIds.has(id));

      if (missingIds.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Some user IDs were not found`,
            details: { missingUserIds: missingIds },
          },
          { status: 404 }
        );
      }

      targetUserIds = userIds;
    }

    // Create notifications using batch writes
    const BATCH_SIZE = 100;
    let createdCount = 0;

    for (let i = 0; i < targetUserIds.length; i += BATCH_SIZE) {
      const batch = targetUserIds.slice(i, i + BATCH_SIZE);
      const operations = batch.map((userId) => ({
        type: "set" as const,
        collection: "notifications",
        documentId: `${userId}_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        data: {
          userId,
          type,
          title,
          message: message || null,
          link: link || null,
          isRead: false,
        },
      }));
      await batchWrite(operations);
      createdCount += batch.length;
    }

    // Log admin action
    await createDocument("adminLogs", {
      adminId: admin.id,
      action: "SEND_NOTIFICATION",
      entity: "Notification",
      details: {
        type,
        title,
        recipientCount: createdCount,
        targetAll: userIds.length === 1 && userIds[0] === "all",
        targetUserIds: userIds.length === 1 && userIds[0] === "all" ? null : targetUserIds,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          type,
          title,
          recipientCount: createdCount,
        },
        message: `Notification sent to ${createdCount} user(s) successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin notification send error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
