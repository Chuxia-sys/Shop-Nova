import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { queryCollection, getDocument, updateDocument, deleteDocument } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";
import { z } from "zod";

const markReadSchema = z.object({
  notificationId: z.string().optional(),
  all: z.boolean().optional(),
});

const deleteSchema = z.object({
  notificationId: z.string().min(1, "Notification ID is required"),
});

interface NotificationDoc extends FirestoreDocument {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  isRead: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentUser();
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const unreadOnly = searchParams.get("unread") === "true";

    const filters: any[] = [
      { field: "userId", operator: "==", value: auth.user.id },
      { field: "deleted", operator: "==", value: false },
    ];

    if (unreadOnly) {
      filters.push({ field: "isRead", operator: "==", value: false });
    }

    const allNotifications = await queryCollection<NotificationDoc>(
      "notifications",
      filters,
      "createdAt",
      "desc"
    );

    // Paginate in memory
    const totalCount = allNotifications.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIdx = (page - 1) * limit;
    const paginatedData = allNotifications.slice(startIdx, startIdx + limit);

    // Count unread
    const unreadCount = allNotifications.filter((n) => !n.isRead).length;

    const data = paginatedData.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message || null,
      link: n.link || null,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = markReadSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { notificationId, all } = validated.data;

    if (all) {
      // Mark all notifications as read
      const allNotifications = await queryCollection<NotificationDoc>(
        "notifications",
        [
          { field: "userId", operator: "==", value: auth.user.id },
          { field: "isRead", operator: "==", value: false },
          { field: "deleted", operator: "==", value: false },
        ]
      );

      for (const n of allNotifications) {
        await updateDocument<NotificationDoc>("notifications", n.id, { isRead: true });
      }

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Either notificationId or all=true is required",
        },
        { status: 400 }
      );
    }

    // Mark single notification as read
    const notification = await getDocument<NotificationDoc>("notifications", notificationId);

    if (!notification) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    if (notification.userId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    await updateDocument<NotificationDoc>("notifications", notificationId, { isRead: true });

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Notification update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = deleteSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { notificationId } = validated.data;

    const notification = await getDocument<NotificationDoc>("notifications", notificationId);

    if (!notification) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    if (notification.userId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    await deleteDocument("notifications", notificationId);

    return NextResponse.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Notification deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
