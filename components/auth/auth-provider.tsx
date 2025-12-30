"use client";

import { ReactNode, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

/**
 * AuthProvider Component
 *
 * Initializes authentication on app startup.
 * Wraps the entire application to ensure auth state is available globally.
 * Should be placed in the root layout.
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   {children}
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  // Initialize auth on app startup
  useEffect(() => {
    console.log("[AuthProvider] Initializing auth on app startup");
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
}
