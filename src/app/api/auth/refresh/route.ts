import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const FIREBASE_API_KEY = "AIzaSyCjp57qy9edq4CbZv_o7lysP5rVd2imT7I";
const FIREBASE_TOKEN_URL = "https://securetoken.googleapis.com/v1/token";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshTokenCookie = cookieStore.get("__refreshToken")?.value;
    const sessionToken = cookieStore.get("__session")?.value;

    // Try refresh token first, fall back to session token
    const refreshToken = refreshTokenCookie || sessionToken;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: "No refresh token provided" },
        { status: 401 }
      );
    }

    // Refresh token via Firebase Auth REST API
    const refreshResponse = await fetch(
      `${FIREBASE_TOKEN_URL}?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      }
    );

    const refreshData = await refreshResponse.json();

    if (!refreshResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session token" },
        { status: 401 }
      );
    }

    const { id_token, refresh_token, expires_in } = refreshData;

    // Set new session cookie
    cookieStore.set("__session", id_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expires_in || 14 * 24 * 60 * 60,
      path: "/",
    });

    // Store refresh token separately
    if (refresh_token) {
      cookieStore.set("__refresh_token", refresh_token, {
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
        accessToken: id_token,
        refreshToken: refresh_token,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { success: false, error: "Invalid or expired session token" },
      { status: 401 }
    );
  }
}
