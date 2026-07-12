import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider, facebookProvider } from "./firebase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";

export interface FirebaseUserData {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  emailVerified: boolean;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isBanned: boolean;
  banReason: string | null;
  lastLoginAt: string | null;
  provider: string;
  [key: string]: unknown;
}

export type AuthResult =
  | { authenticated: true; user: FirebaseUserData }
  | { authenticated: false; error: string };

// ---------------------------------------------------------------------------
// Helper: Build basic FirebaseUserData from Firebase Auth user (no Firestore)
// ---------------------------------------------------------------------------

function buildBasicUserData(
  firebaseUser: FirebaseUser,
  additionalData?: Record<string, unknown>
): FirebaseUserData {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || "",
    name: firebaseUser.displayName || (additionalData?.name as string) || "",
    image: firebaseUser.photoURL || null,
    role: (additionalData?.role as UserRole) || "CUSTOMER",
    emailVerified: firebaseUser.emailVerified,
    phone: firebaseUser.phoneNumber || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    isBanned: false,
    banReason: null,
    lastLoginAt: new Date().toISOString(),
    provider: (additionalData?.provider as string) || "email",
  };
}

// ---------------------------------------------------------------------------
// Helper: Create/update user document in Firestore
// ---------------------------------------------------------------------------

async function syncUserToFirestore(
  firebaseUser: FirebaseUser,
  additionalData?: Record<string, unknown>
): Promise<FirebaseUserData | null> {
  try {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    const now = serverTimestamp();

    if (!userSnap.exists()) {
      // Create new user document
      await setDoc(userRef, {
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || additionalData?.name || "",
        image: firebaseUser.photoURL || null,
        emailVerified: firebaseUser.emailVerified,
        phone: firebaseUser.phoneNumber || null,
        role: additionalData?.role || "CUSTOMER",
        isActive: true,
        isBanned: false,
        banReason: null,
        provider: additionalData?.provider || "email",
        deleted: false,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      });
    } else {
      // Update existing user (only mutable fields)
      await updateDoc(userRef, {
        name: firebaseUser.displayName || additionalData?.name || userSnap.data()?.name || "",
        image: firebaseUser.photoURL || null,
        emailVerified: firebaseUser.emailVerified,
        phone: firebaseUser.phoneNumber || null,
        updatedAt: now,
        lastLoginAt: now,
      });
    }

    return buildBasicUserData(firebaseUser, additionalData);
  } catch (err) {
    console.warn("Firestore sync failed (non-blocking):", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sign Up with Email & Password
// ---------------------------------------------------------------------------

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<AuthResult> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    // Update display name
    await updateProfile(credential.user, { displayName: name });

    // Send verification email
    await sendEmailVerification(credential.user);

    // Firestore sync is non-blocking
    const userData = await upsertUserToFirestore(credential.user, {
      name,
      provider: "email",
    });

    return {
      authenticated: true,
      user: userData ?? buildBasicUserData(credential.user, { name, provider: "email" }),
    };
  } catch (error: unknown) {
    const message = getFirebaseErrorMessage(error, "Signup failed");
    return { authenticated: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Login with Email & Password
// ---------------------------------------------------------------------------

export async function loginWithEmail(
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<AuthResult> {
  try {
    // Set persistence based on remember me
  await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );

    const credential = await signInWithEmailAndPassword(auth, email, password);

    // Check if user is banned (Firestore lookup — fall back gracefully)
    try {
      const userRef = doc(db, "users", credential.user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      if (userData?.isBanned) {
        await signOut(auth);
        return {
          authenticated: false,
          error: userData.banReason || "Your account has been banned",
        };
      }
    } catch {
      // Firestore unavailable — proceed without ban check
      console.warn("Firestore unavailable during login — skipping ban check");
    }

    // Firestore sync is non-blocking
    const firestoreUser = await upsertUserToFirestore(credential.user);

    return {
      authenticated: true,
      user: firestoreUser ?? buildBasicUserData(credential.user),
    };
  } catch (error: unknown) {
    const message = getFirebaseErrorMessage(error, "Invalid email or password");
    return { authenticated: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Google Login
// ---------------------------------------------------------------------------

export async function loginWithGoogle(): Promise<AuthResult> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const credential = await signInWithPopup(auth, googleProvider);

    // Firestore sync is non-blocking — login succeeds on Firebase Auth alone
    const firestoreUser = await upsertUserToFirestore(credential.user, {
      provider: "google",
    });

    return {
      authenticated: true,
      user: firestoreUser ?? buildBasicUserData(credential.user, { provider: "google" }),
    };
  } catch (error: unknown) {
    const message = getFirebaseErrorMessage(error, "Google login failed");
    return { authenticated: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Facebook Login
// ---------------------------------------------------------------------------

export async function loginWithFacebook(): Promise<AuthResult> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const credential = await signInWithPopup(auth, facebookProvider);

    // Firestore sync is non-blocking — login succeeds on Firebase Auth alone
    const firestoreUser = await upsertUserToFirestore(credential.user, {
      provider: "facebook",
    });

    return {
      authenticated: true,
      user: firestoreUser ?? buildBasicUserData(credential.user, { provider: "facebook" }),
    };
  } catch (error: unknown) {
    const message = getFirebaseErrorMessage(error, "Facebook login failed");
    return { authenticated: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// ---------------------------------------------------------------------------
// Send Password Reset Email
// ---------------------------------------------------------------------------

export async function sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: unknown) {
    const message = getFirebaseErrorMessage(error, "Failed to send password reset email");
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Confirm Password Reset
// ---------------------------------------------------------------------------

export async function resetPassword(
  code: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await confirmPasswordReset(auth, code, newPassword);
    return { success: true };
  } catch (error: unknown) {
    const message = getFirebaseErrorMessage(error, "Failed to reset password");
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Send Email Verification
// ---------------------------------------------------------------------------

export async function sendVerificationEmail(): Promise<{ success: boolean; error?: string }> {
  try {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      return { success: true };
    }
    return { success: false, error: "No user logged in" };
  } catch (error: unknown) {
    const message = getFirebaseErrorMessage(error, "Failed to send verification email");
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Get Current User from Firestore
// ---------------------------------------------------------------------------

export async function getFirestoreUser(
  userId: string
): Promise<FirebaseUserData | null> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;

    const data = userSnap.data();
    return {
      id: userId,
      email: data.email as string,
      name: data.name as string | null,
      image: data.image as string | null,
      role: data.role as FirebaseUserData["role"],
      emailVerified: data.emailVerified as boolean,
      phone: (data.phone as string | null) || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      isActive: data.isActive as boolean,
      isBanned: data.isBanned as boolean,
      banReason: (data.banReason as string | null) || null,
      lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString?.() || null,
      provider: (data.provider as string) || "email",
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Auth State Observer (returns unsubscribe function)
// ---------------------------------------------------------------------------

export function onAuthChange(
  callback: (user: FirebaseUserData | null) => void
): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Try Firestore first, fall back to basic auth data
      const userData = await getFirestoreUser(firebaseUser.uid);
      if (userData) {
        callback(userData);
      } else {
        // Firestore unavailable or user doc missing — use auth data
        callback(buildBasicUserData(firebaseUser));
      }
    } else {
      callback(null);
    }
  });
}

// ---------------------------------------------------------------------------
// Update Profile
// ---------------------------------------------------------------------------

export async function updateUserProfile(
  userId: string,
  data: { name?: string; image?: string; phone?: string }
): Promise<FirebaseUserData | null> {
  try {
    const userRef = doc(db, "users", userId);
    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.phone !== undefined) updateData.phone = data.phone;

    await updateDoc(userRef, updateData);

    // Update Firebase Auth profile
    if (auth.currentUser && data.name) {
      await updateProfile(auth.currentUser, {
        displayName: data.name,
        ...(data.image ? { photoURL: data.image } : {}),
      });
    }

    return getFirestoreUser(userId);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Check if user is admin
// ---------------------------------------------------------------------------

export async function isAdmin(userId: string): Promise<boolean> {
  const user = await getFirestoreUser(userId);
  return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
}

// ---------------------------------------------------------------------------
// Helper: Get Firebase error message
// ---------------------------------------------------------------------------

function getFirebaseErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code;
    switch (code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password";
      case "auth/email-already-in-use":
        return "An account with this email already exists";
      case "auth/weak-password":
        return "Password should be at least 6 characters";
      case "auth/invalid-email":
        return "Invalid email address";
      case "auth/user-disabled":
        return "This account has been disabled";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later";
      case "auth/expired-action-code":
        return "This reset link has expired";
      case "auth/invalid-action-code":
        return "Invalid or expired reset link";
      case "auth/popup-closed-by-user":
        return "Sign-in popup was closed";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with the same email but different sign-in method";
      default:
        return fallback;
    }
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Helper: Upsert user to Firestore (internal)
// ---------------------------------------------------------------------------

async function upsertUserToFirestore(
  firebaseUser: FirebaseUser,
  additionalData?: Record<string, unknown>
): Promise<FirebaseUserData | null> {
  return syncUserToFirestore(firebaseUser, additionalData);
}