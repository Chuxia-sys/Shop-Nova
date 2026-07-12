import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDocument, updateDocument, createDocument } from "@/lib/firestore";
import type { FirebaseUserData } from "@/lib/firebase-auth";

const FACEBOOK_GRAPH_URL = "https://graph.facebook.com/v18.0";
const FIREBASE_API_KEY = "AIzaSyAJ5_StcpKWUARQ1C2oZGNymwl_WKEwU_w";
const FIREBASE_AUTH_BASE = "https://identitytoolkit.googleapis.com/v1/accounts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accessToken: fbAccessToken } = body;

    if (!fbAccessToken) {
      return NextResponse.json(
        { success: false, error: "Facebook access token is required" },
        { status: 400 }
      );
    }

    // Verify token with Facebook
    const userInfoResponse = await fetch(
      `${FACEBOOK_GRAPH_URL}/me?fields=id,name,email,picture&access_token=${fbAccessToken}`
    );

    if (!userInfoResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Invalid Facebook access token" },
        { status: 401 }
      );
    }

    const fbUser = await userInfoResponse.json();

    if (!fbUser.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve email from Facebook. Please ensure email permission is granted.",
        },
        { status: 400 }
      );
    }

    // Sign in with Firebase using the Facebook token
    const signInResponse = await fetch(
      `${FIREBASE_AUTH_BASE}:signInWithIdp?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestUri: "http://localhost:3000",
          postBody: `access_token=${fbAccessToken}&providerId=facebook.com`,
          returnSecureToken: true,
          returnIdpCredential: true,
        }),
      }
    );

    const signInData = await signInResponse.json();

    if (!signInResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Facebook authentication failed" },
        { status: 401 }
      );
    }

    const { localId, idToken, refreshToken: fbRefreshToken } = signInData;
    const profileImage = fbUser.picture?.data?.url;

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
          email: fbUser.email,
          name: fbUser.name || fbUser.email.split("@")[0],
          image: profileImage || null,
          role: "CUSTOMER",
          emailVerified: true,
          phone: null,
          isActive: true,
          isBanned: false,
          banReason: null,
          provider: "facebook",
        },
        localId
      );
    } else {
      // Update last login
      await updateDocument("users", localId, {
        lastLoginAt: new Date().toISOString(),
      } as Record<string, unknown>);

      // Update profile picture if not set
      if (profileImage && !userData.image) {
        await updateDocument("users", localId, {
          image: profileImage,
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
        email: userData?.email || fbUser.email,
        name: userData?.name || fbUser.name,
        image: userData?.image || profileImage,
        role: userData?.role || "CUSTOMER",
      },
    });
  } catch (error) {
    console.error("Facebook auth error:", error);
    return NextResponse.json(
      { success: false, error: "Facebook authentication failed" },
      { status: 500 }
    );
  }
}
