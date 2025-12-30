"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallback?: ReactNode;
}

/**
 * ProtectedRoute Component
 *
 * Wraps components to ensure only authenticated users can access them.
 * Optionally enforces role-based access control.
 */
export function ProtectedRoute({
  children,
  requiredRole,
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, isLoading } = useAuthStore();
  const [hasChecked, setHasChecked] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Check auth after initialized
  useEffect(() => {
    if (isLoading) return;

    // Check authentication
    if (!isAuthenticated || !user) {
      console.log("[ProtectedRoute] Redirecting to login - not authenticated");
      setShouldRedirect(true);
      router.push("/login");
      return;
    }

    // Check role if required
    if (requiredRole && user.role !== requiredRole) {
      console.log(
        `[ProtectedRoute] Access denied - required role: ${requiredRole}, user role: ${user.role}`
      );
      setShouldRedirect(true);
      router.push("/");
      return;
    }

    setHasChecked(true);
  }, [user, isAuthenticated, isLoading, requiredRole, router]);

  // Show fallback or loading state while checking auth
  if (!hasChecked) {
    return fallback || (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Don't render if should redirect
  if (shouldRedirect) {
    return null;
  }

  return <>{children}</>;
}
