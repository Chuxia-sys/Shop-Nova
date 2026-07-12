"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import type { ApiResponse } from "@/types";
import type { FirebaseUserData } from "@/lib/firebase-auth";
import {
  loginWithEmail,
  signUpWithEmail,
  logoutUser,
  loginWithGoogle,
  loginWithFacebook,
  sendPasswordReset,
  sendVerificationEmail,
  updateUserProfile,
  onAuthChange,
} from "@/lib/firebase-auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  name?: string;
  image?: string;
  phone?: string;
}

export interface UseAuthReturn {
  user: FirebaseUserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<ApiResponse<FirebaseUserData>>;
  signup: (input: SignupInput) => Promise<ApiResponse<FirebaseUserData>>;
  logout: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<ApiResponse<FirebaseUserData>>;
  loginWithGoogle: () => Promise<ApiResponse<FirebaseUserData>>;
  loginWithFacebook: () => Promise<ApiResponse<FirebaseUserData>>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  sendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Provides authentication state and actions using Firebase Auth.
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    setIsLoading,
    logout: storeLogout,
  } = useAuthStore();

  // -----------------------------------------------------------------------
  // Listen to Firebase Auth state changes
  // -----------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        storeLogout();
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const login = useCallback(
    async (input: LoginInput): Promise<ApiResponse<FirebaseUserData>> => {
      setIsLoading(true);
      try {
        const result = await loginWithEmail(input.email, input.password, input.rememberMe);

        if (result.authenticated) {
          setUser(result.user);
          return { success: true, data: result.user };
        }

        return { success: false, error: result.error };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "An unexpected error occurred",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [setUser, setIsLoading]
  );

  const signup = useCallback(
    async (input: SignupInput): Promise<ApiResponse<FirebaseUserData>> => {
      setIsLoading(true);
      try {
        const result = await signUpWithEmail(input.email, input.password, input.name);

        if (result.authenticated) {
          setUser(result.user);
          return { success: true, data: result.user };
        }

        return { success: false, error: result.error };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "An unexpected error occurred",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [setUser, setIsLoading]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutUser();
    } catch {
      // Best-effort
    } finally {
      storeLogout();
      router.push("/");
    }
  }, [storeLogout, router]);

  const updateProfile = useCallback(
    async (input: UpdateProfileInput): Promise<ApiResponse<FirebaseUserData>> => {
      try {
        if (!user) return { success: false, error: "Not authenticated" };
        const updatedUser = await updateUserProfile(user.id, input);
        if (updatedUser) {
          setUser(updatedUser);
          return { success: true, data: updatedUser };
        }
        return { success: false, error: "Failed to update profile" };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update profile",
        };
      }
    },
    [user, setUser]
  );

  const handleGoogleLogin = useCallback(async (): Promise<ApiResponse<FirebaseUserData>> => {
    setIsLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.authenticated) {
        setUser(result.user);
        return { success: true, data: result.user };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Google login failed",
      };
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setIsLoading]);

  const handleFacebookLogin = useCallback(async (): Promise<ApiResponse<FirebaseUserData>> => {
    setIsLoading(true);
    try {
      const result = await loginWithFacebook();
      if (result.authenticated) {
        setUser(result.user);
        return { success: true, data: result.user };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Facebook login failed",
      };
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setIsLoading]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    updateProfile,
    loginWithGoogle: handleGoogleLogin,
    loginWithFacebook: handleFacebookLogin,
    sendPasswordReset,
    sendVerificationEmail,
  };
}
