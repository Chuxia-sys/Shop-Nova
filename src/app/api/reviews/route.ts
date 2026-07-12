import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDocument, queryCollection, createDocument } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";
import { reviewSchema } from "@/lib/validations";
import { PAGINATION } from "@/lib/constants";

interface ReviewDoc extends FirestoreDocument {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  isApproved: boolean;
}

interface UserDoc extends FirestoreDocument {
  name?: string;
  image?: string;
}

interface ProductDoc extends FirestoreDocument {
  name: string;
}

interface OrderDoc extends FirestoreDocument {
  userId: string;
  paymentStatus: string;
  status: string;
}

interface OrderItemDoc extends FirestoreDocument {
  productId: string;
  orderId: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      PAGINATION.REVIEW_PAGE_SIZE * 4,
      Math.max(1, parseInt(searchParams.get("limit") || String(PAGINATION.REVIEW_PAGE_SIZE), 10))
    );

    // Verify product exists
    const product = await getDocument<ProductDoc>("products", productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Fetch all approved reviews for the product
    const allReviews = await queryCollection<ReviewDoc>(
      "reviews",
      [
        { field: "productId", operator: "==", value: productId },
        { field: "isApproved", operator: "==", value: true },
        { field: "deleted", operator: "==", value: false },
      ],
      "createdAt",
      "desc"
    );

    const totalCount = allReviews.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIdx = (page - 1) * limit;
    const paginatedReviews = allReviews.slice(startIdx, startIdx + limit);

    // Enrich with user data
    const data = await Promise.all(
      paginatedReviews.map(async (review) => {
        const user = await getDocument<UserDoc>("users", review.userId);
        return {
          id: review.id,
          rating: review.rating,
          title: review.title || null,
          comment: review.comment || null,
          createdAt: review.createdAt,
          user: {
            id: review.userId,
            name: user?.name || "Anonymous",
            image: user?.image || null,
          },
        };
      })
    );

    // Calculate aggregate
    const avgRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      aggregate: {
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: allReviews.length,
      },
    });
  } catch (error) {
    console.error("Reviews fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = reviewSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { productId, rating, title, comment } = validated.data;

    // Verify product exists
    const product = await getDocument<ProductDoc>("products", productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if user has purchased this product
    const userOrders = await queryCollection<OrderDoc>(
      "orders",
      [
        { field: "userId", operator: "==", value: auth.user.id },
        { field: "paymentStatus", operator: "==", value: "COMPLETED" },
        { field: "deleted", operator: "==", value: false },
      ]
    );

    const validStatuses = ["DELIVERED", "SHIPPED", "CONFIRMED", "PROCESSING"];
    let hasPurchased = false;

    for (const order of userOrders) {
      if (!validStatuses.includes(order.status)) continue;
      const items = await queryCollection<OrderItemDoc>(
        "orderItems",
        [
          { field: "orderId", operator: "==", value: order.id },
          { field: "productId", operator: "==", value: productId },
          { field: "deleted", operator: "==", value: false },
        ]
      );
      if (items.length > 0) {
        hasPurchased = true;
        break;
      }
    }

    if (!hasPurchased) {
      return NextResponse.json(
        {
          success: false,
          error: "You must purchase this product before reviewing it",
        },
        { status: 403 }
      );
    }

    // Prevent duplicate reviews (one per user per product)
    const existingReviews = await queryCollection<ReviewDoc>(
      "reviews",
      [
        { field: "productId", operator: "==", value: productId },
        { field: "userId", operator: "==", value: auth.user.id },
        { field: "deleted", operator: "==", value: false },
      ]
    );

    if (existingReviews.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "You have already reviewed this product. You can edit your existing review.",
        },
        { status: 409 }
      );
    }

    // Create the review
    const review = await createDocument<ReviewDoc>("reviews", {
      userId: auth.user.id,
      productId,
      rating,
      title: title || null,
      comment: comment || null,
      isApproved: false, // Requires admin approval
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: review.id,
          rating: review.rating,
          title: review.title || null,
          comment: review.comment || null,
          isApproved: false,
          createdAt: review.createdAt,
          user: {
            id: auth.user.id,
            name: auth.user.name || "Anonymous",
            image: auth.user.image || null,
          },
        },
        message: "Your review has been submitted and awaits approval.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Review creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create review" },
      { status: 500 }
    );
  }
}
