import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDocument, updateDocument, createDocument } from "@/lib/firestore";
import type { FirebaseUserData } from "@/lib/firebase-auth";

const GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const FIREBASE_API_KEY = "AIzaSyAJ5_StcpKWUARQ1C2oZGNymwl_WKEwU_w";
const FIREBASE_AUTH_BASE = "https://identitytoolkit.googleapis.com/v1/accounts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accessToken: googleAccessToken } = body;

    if (!googleAccessToken) {
      return NextResponse.json(
        { success: false, error: "Google access token is required" },
        { status: 400 }
      );
    }

    // Verify token with Google
    const userInfoResponse = await fetch(GOOGLE_USER_INFO_URL, {
      headers: {
        Authorization: `Bearer ${googleAccessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Invalid Google access token" },
        { status: 401 }
      );
    }

    const googleUser = await userInfoResponse.json();

    if (!googleUser.email) {
      return NextResponse.json(
        { success: false, error: "Unable to retrieve email from Google" },
        { status: 400 }
      );
    }

    // Sign in with Firebase using the Google credential
    // We use signInWithIdp via the REST API to exchange the Google token
    const signInResponse = await fetch(
      `${FIREBASE_AUTH_BASE}:signInWithIdp?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestUri: "http://localhost:3000",
          postBody: `access_token=${googleAccessToken}&providerId=google.com`,
          returnSecureToken: true,
          returnIdpCredential: true,
        }),
      }
    );

    const signInData = await signInResponse.json();

    if (!signInResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Google authentication failed" },
        { status: 401 }
      );
    }

    const { localId, idToken, refreshToken: fbRefreshToken } = signInData;

    // Check if user exists in Firestore
    let userData = await getDocument<FirebaseUserData>("users", localId);

    if (userData && userData.isBanned) {
      return NextResponse.json(
        {
          success: false,
          error: (userData.banReason as string) || "Account has been banned",
        },
        { status: 403 }
      );
    }

    if (!userData) {
      // Create new user in Firestore
      await createDocument(
        "users",
        {
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split("@")[0],
          image: googleUser.picture || null,
          role: "CUSTOMER",
          emailVerified: true,
          phone: null,
          isActive: true,
          isBanned: false,
          banReason: null,
          provider: "google",
        },
        localId
      );
    } else {
      // Update last login
      await updateDocument("users", localId, {
        lastLoginAt: new Date().toISOString(),
      } as Record<string, unknown>);

      // Update profile picture if not set
      if (googleUser.picture && !userData.image) {
        await updateDocument("users", localId, {
          image: googleUser.picture,
        } as Record<string, unknown>);
      }
    }

    // Re-fetch user data
    userData = await getDocument<FirebaseUserData>("users", localId);

    // Set Firebase ID token as session cookie
    const cookieStore = await cookies();
    cookieStore.set("__session", idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 14 * 24 * 60 * 60,
      path: "/",
    });

    // Store refresh token for token refresh
    if (fbRefreshToken) {
      cookieStore.set("__refresh_token", fbRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 365 * 24 * 60 * 60,
        path: "/",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: localId,
        email: userData?.email || googleUser.email,
        name: userData?.name || googleUser.name,
        image: userData?.image || googleUser.picture,
        role: userData?.role || "CUSTOMER",
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { success: false, error: "Google authentication failed" },
      { status: 500 }
    );
  }
}
