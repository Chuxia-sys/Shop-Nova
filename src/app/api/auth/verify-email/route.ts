import { NextResponse } from "next/server";
import { updateDocument } from "@/lib/firestore";

const FIREBASE_API_KEY = "AIzaSyAJ5_StcpKWUARQ1C2oZGNymwl_WKEwU_w";
const FIREBASE_AUTH_BASE = "https://identitytoolkit.googleapis.com/v1/accounts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Verification token is required" },
        { status: 400 }
      );
    }

    // First, exchange the oobCode for the user's idToken
    // The token from the email link is an oobCode (out-of-band code)
    const verifyResponse = await fetch(
      `${FIREBASE_AUTH_BASE}:update?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oobCode: token,
        }),
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok) {
      const errorMessage = getFirebaseErrorMessage(verifyData.error?.message);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    // Update emailVerified in Firestore
    const localId = verifyData.localId;
    if (localId) {
      await updateDocument("users", localId, {
        emailVerified: true,
      } as Record<string, unknown>).catch((err) =>
        console.error("Failed to update Firestore emailVerified:", err)
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

function getFirebaseErrorMessage(code: string | undefined): string {
  switch (code) {
    case "EXPIRED_OOB_CODE":
      return "This verification link has expired";
    case "INVALID_OOB_CODE":
      return "Invalid or expired verification link";
    default:
      return "Invalid or expired verification token";
  }
}
