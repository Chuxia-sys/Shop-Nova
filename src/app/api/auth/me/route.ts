import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDocument, updateDocument } from "@/lib/firestore";
import type { FirebaseUserData } from "@/lib/firebase-auth";
import { profileSchema } from "@/lib/validations";

export async function GET() {
  try {
    const auth = await getCurrentUser();
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      );
    }

    const user = await getDocument<FirebaseUserData>("users", auth.user.id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
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
    const validated = profileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (validated.data.name !== undefined) updateData.name = validated.data.name;
    if (validated.data.phone !== undefined) updateData.phone = validated.data.phone;
    if (validated.data.image !== undefined) updateData.image = validated.data.image;

    const updatedUser = await updateDocument<FirebaseUserData>(
      "users",
      auth.user.id,
      updateData
    );

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
