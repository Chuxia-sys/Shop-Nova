import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  uploadFromBuffer,
  isValidFileType,
  isValidFileSize,
  ALLOWED_MIME_TYPES,
} from "@/lib/firebase-storage";

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentUser();
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isValidFileType(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (!isValidFileSize(file.size)) {
      return NextResponse.json(
        {
          success: false,
          error: "File size exceeds the 5MB limit",
        },
        { status: 400 }
      );
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();

    // Determine folder based on user role
    const folder = auth.user.role === "ADMIN" || auth.user.role === "SUPER_ADMIN"
      ? "ecommerce/admin"
      : "ecommerce/users";

    const result = await uploadFromBuffer(bytes, file.type, folder, file.name);

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        path: result.path,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
