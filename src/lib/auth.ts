import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { FirebaseUserData } from "./firebase-auth";

export type AuthResult =
  | { authenticated: true; user: FirebaseUserData }
  | { authenticated: false; error: string };

const FIREBASE_API_KEY = "AIzaSyCjp57qy9edq4CbZv_o7lysP5rVd2imT7I";
const PROJECT_ID = "shopnova-408ee";

/**
 * Server-side auth check using Firebase Auth ID token from cookies.
 * Firebase Auth sets the "__session" cookie automatically.
 * Uses Firebase REST APIs exclusively — no client SDK required.
 */
export async function getCurrentUser(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    if (!sessionCookie) {
      return { authenticated: false, error: "No authentication token found" };
    }

    // Verify the ID token server-side via Firebase Auth REST API
    const decodedToken = await verifyFirebaseToken(sessionCookie);

    if (!decodedToken) {
      return { authenticated: false, error: "Invalid or expired token" };
    }

    // Fetch Firestore user data via REST API (no client SDK needed)
    const firestoreUser = await fetchFirestoreUser(decodedToken.uid);

    if (firestoreUser) {
      // Check ban/active status from Firestore
      if (firestoreUser.isBanned) {
        return {
          authenticated: false,
          error: firestoreUser.banReason || "Account has been banned",
        };
      }

      if (firestoreUser.isActive === false) {
        return { authenticated: false, error: "Account is deactivated" };
      }

      return { authenticated: true, user: firestoreUser };
    }

    // Firestore unavailable or user doc missing — return auth-level data
    return {
      authenticated: true,
      user: {
        id: decodedToken.uid,
        email: decodedToken.email || "",
        name: null,
        image: null,
        role: "CUSTOMER",
        emailVerified: decodedToken.email_verified || false,
        phone: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        isBanned: false,
        banReason: null,
        lastLoginAt: null,
        provider: "email",
      },
    };
  } catch (error) {
    console.error("Auth error:", error);
    return { authenticated: false, error: "Authentication error" };
  }
}

export async function requireAuth(): Promise<FirebaseUserData> {
  const result = await getCurrentUser();
  if (!result.authenticated) {
    redirect("/login");
  }
  return result.user;
}

export async function requireAdmin(): Promise<FirebaseUserData> {
  const result = await getCurrentUser();
  if (!result.authenticated) {
    redirect("/login");
  }
  if (result.user.role !== "ADMIN" && result.user.role !== "SUPER_ADMIN") {
    redirect("/");
  }
  return result.user;
}

export async function optionalAuth(): Promise<FirebaseUserData | null> {
  const result = await getCurrentUser();
  if (!result.authenticated) return null;
  return result.user;
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("__session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  cookieStore.set("__refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

// ---------------------------------------------------------------------------
// Firebase Admin SDK token verification (server-side)
// ---------------------------------------------------------------------------

type FirebaseUserRole = "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";

interface DecodedFirebaseToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
  [key: string]: unknown;
}

/**
 * Verifies a Firebase ID token server-side.
 * Uses the Firebase Auth REST API to verify tokens without the Admin SDK.
 */
async function verifyFirebaseToken(token: string): Promise<DecodedFirebaseToken | null> {
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const user = data.users?.[0];

    if (!user) return null;

    return {
      uid: user.localId,
      email: user.email,
      email_verified: user.emailVerified,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Firestore REST API helper (no client SDK)
// ---------------------------------------------------------------------------

interface FirestoreDocumentFields {
  [key: string]: {
    stringValue?: string;
    integerValue?: string;
    doubleValue?: number;
    booleanValue?: boolean;
    nullValue?: null;
    timestampValue?: string;
    mapValue?: { fields: FirestoreDocumentFields };
  };
}

function extractFieldValue(
  fields: FirestoreDocumentFields | undefined,
  key: string
): unknown {
  if (!fields?.[key]) return undefined;
  const value = fields[key];
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.nullValue !== undefined) return null;
  if (value.timestampValue !== undefined) return value.timestampValue;
  return undefined;
}

/**
 * Fetches a Firestore document via REST API.
 * Returns null if the document doesn't exist or Firestore is unavailable.
 */
async function fetchFirestoreUser(
  uid: string
): Promise<FirebaseUserData | null> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}?key=${FIREBASE_API_KEY}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      // 404 means user doc doesn't exist yet — not an error
      if (response.status === 404) return null;
      console.warn(`Firestore REST API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const fields = data.fields as FirestoreDocumentFields | undefined;

    if (!fields) return null;

    const role = (extractFieldValue(fields, "role") as string) || "CUSTOMER";
    const isValidRole = (r: string): r is "CUSTOMER" | "ADMIN" | "SUPER_ADMIN" =>
      ["CUSTOMER", "ADMIN", "SUPER_ADMIN"].includes(r);

    return {
      id: uid,
      email: (extractFieldValue(fields, "email") as string) || "",
      name: (extractFieldValue(fields, "name") as string) || null,
      image: (extractFieldValue(fields, "image") as string) || null,
      role: isValidRole(role) ? role : "CUSTOMER",
      emailVerified: (extractFieldValue(fields, "emailVerified") as boolean) ?? false,
      phone: (extractFieldValue(fields, "phone") as string) || null,
      createdAt: (extractFieldValue(fields, "createdAt") as string) || new Date().toISOString(),
      updatedAt: (extractFieldValue(fields, "updatedAt") as string) || new Date().toISOString(),
      isActive: (extractFieldValue(fields, "isActive") as boolean) ?? true,
      isBanned: (extractFieldValue(fields, "isBanned") as boolean) ?? false,
      banReason: (extractFieldValue(fields, "banReason") as string) || null,
      lastLoginAt: (extractFieldValue(fields, "lastLoginAt") as string) || null,
      provider: (extractFieldValue(fields, "provider") as string) || "email",
    };
  } catch (err) {
    console.warn("Firestore REST API unavailable (server-side):", err);
    return null;
  }
}
