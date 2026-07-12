import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validations";

const FIREBASE_API_KEY = "AIzaSyAJ5_StcpKWUARQ1C2oZQGymwl_WKEwU_w";
const FIREBASE_AUTH_BASE = "https://identitytoolkit.googleapis.com/v1/accounts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = forgotPasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = validated.data;

    // Send password reset email via Firebase Auth REST API
    // Firebase handles this securely without revealing if the email exists
    await fetch(
      `${FIREBASE_AUTH_BASE}:sendOobCode?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "PASSWORD_RESET",
          email,
        }),
      }
    ).catch((err) => console.error("Reset email API call failed:", err));

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message:
        "If an account exists with this email, you will receive a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
