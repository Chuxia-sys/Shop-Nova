import { NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validations";

const FIREBASE_API_KEY = "AIzaSyAJ5_StcpKWUARQ1C2oZGNymwl_WKEwU_w";
const FIREBASE_AUTH_BASE = "https://identitytoolkit.googleapis.com/v1/accounts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = resetPasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token, password } = validated.data;

    // Reset password via Firebase Auth REST API
    const resetResponse = await fetch(
      `${FIREBASE_AUTH_BASE}:resetPassword?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oobCode: token,
          newPassword: password,
        }),
      }
    );

    const resetData = await resetResponse.json();

    if (!resetResponse.ok) {
      const errorMessage = getFirebaseErrorMessage(resetData.error?.message);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

function getFirebaseErrorMessage(code: string | undefined): string {
  switch (code) {
    case "EXPIRED_OOB_CODE":
      return "This reset link has expired";
    case "INVALID_OOB_CODE":
      return "Invalid or expired reset link";
    case "WEAK_PASSWORD":
      return "Password should be at least 6 characters";
    default:
      return "Invalid or expired reset link";
  }
}
