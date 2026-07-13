import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { loginSchema } from "@/lib/validations";
import { getDocument } from "@/lib/firestore";
import type { FirebaseUserData } from "@/lib/firebase-auth";

const FIREBASE_API_KEY = "AIzaSyCjp57qy9edq4CbZv_o7lysP5rVd2imT7I";
const FIREBASE_AUTH_BASE = "https://identitytoolkit.googleapis.com/v1/accounts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;

    // Authenticate with Firebase Auth REST API
    const signInResponse = await fetch(
      `${FIREBASE_AUTH_BASE}:signInWithPassword?key=${FIREBASE_API_KEY}`,
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

    const signInData = await signInResponse.json();

    if (!signInResponse.ok) {
      const errorMessage = getFirebaseErrorMessage(signInData.error?.message);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 401 }
      );
    }

    const { localId, idToken, refreshToken: fbRefreshToken } = signInData;

    // Get user data from Firestore
    const userData = await getDocument<FirebaseUserData>("users", localId);

    if (!userData) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (userData.isBanned) {
      return NextResponse.json(
        {
          success: false,
          error: (userData.banReason as string) || "Account has been banned",
        },
        { status: 403 }
      );
    }

    if (userData.isActive === false) {
      return NextResponse.json(
        {
          success: false,
          error: "Account has been deactivated",
        },
        { status: 403 }
      );
    }

    // Set Firebase ID token as session cookie
    const cookieStore = await cookies();
    cookieStore.set("__session", idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 14 * 24 * 60 * 60, // 14 days
      path: "/",
    });

    // Store refresh token for token refresh
    if (fbRefreshToken) {
      cookieStore.set("__refresh_token", fbRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 365 * 24 * 60 * 60, // 1 year
        path: "/",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: localId,
        email: userData.email,
        name: userData.name,
        image: userData.image,
        role: userData.role,
        emailVerified: userData.emailVerified,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

function getFirebaseErrorMessage(code: string | undefined): string {
  switch (code) {
    case "EMAIL_NOT_FOUND":
    case "INVALID_PASSWORD":
    case "INVALID_LOGIN_CREDENTIALS":
      return "Invalid email or password";
    case "USER_DISABLED":
      return "This account has been disabled";
    case "TOO_MANY_ATTEMPTS_TRY_LATER":
      return "Too many attempts. Please try again later";
    default:
      return "Invalid email or password";
  }
}
