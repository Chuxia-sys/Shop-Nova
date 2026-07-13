import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/validations";
import { createDocument } from "@/lib/firestore";

const FIREBASE_API_KEY = "AIzaSyCjp57qy9edq4CbZv_o7lysP5rVd2imT7I";
const FIREBASE_AUTH_BASE = "https://identitytoolkit.googleapis.com/v1/accounts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = signupSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = validated.data;

    // Create user with Firebase Auth REST API
    const signUpResponse = await fetch(
      `${FIREBASE_AUTH_BASE}:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const signUpData = await signUpResponse.json();

    if (!signUpResponse.ok) {
      const errorMessage = getFirebaseErrorMessage(signUpData.error?.message);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: signUpData.error?.message === "EMAIL_EXISTS" ? 409 : 400 }
      );
    }

    const { localId, idToken } = signUpData;

    // Create user document in Firestore
    await createDocument(
      "users",
      {
        email,
        name,
        image: null,
        role: "CUSTOMER",
        emailVerified: false,
        phone: null,
        isActive: true,
        isBanned: false,
        banReason: null,
        provider: "email",
      },
      localId
    );

    // Send email verification via Firebase REST API
    await fetch(
      `${FIREBASE_AUTH_BASE}:sendOobCode?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "VERIFY_EMAIL",
          idToken,
        }),
      }
    ).catch((err) => console.error("Verification email failed:", err));

    return NextResponse.json({
      success: true,
      message:
        "Account created successfully! Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

function getFirebaseErrorMessage(code: string | undefined): string {
  switch (code) {
    case "EMAIL_EXISTS":
      return "An account with this email already exists";
    case "WEAK_PASSWORD":
      return "Password should be at least 6 characters";
    case "INVALID_EMAIL":
      return "Invalid email address";
    case "TOO_MANY_ATTEMPTS_TRY_LATER":
      return "Too many attempts. Please try again later";
    default:
      return "An unexpected error occurred during signup";
  }
}
