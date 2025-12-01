"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Assistant } from "./assistant";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types/auth";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, isLoading } = useAuthStore();

  useEffect(() => {
    // Initialize auth from localStorage
    console.log("[Home] Initializing auth...");
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // Redirect based on auth state
    console.log(
      "[Home] Checking auth state - isLoading:",
      isLoading,
      "user:",
      user?.email,
      "role:",
      user?.role,
      "UserRole.ADMIN:",
      UserRole.ADMIN,
      "match:",
      user?.role === UserRole.ADMIN
    );

    if (!isLoading) {
      // Redirect to login if not authenticated
      if (!isAuthenticated || !user) {
        console.log("[Home] Redirecting to login - not authenticated");
        router.push("/login");
      }
      // Redirect admin users to admin chat page
      else if (user.role === UserRole.ADMIN) {
        console.log("[Home] Redirecting to admin chat - user is admin");
        router.push("/admin/chat");
      }
      // Otherwise show assistant for students
      else {
        console.log("[Home] Showing assistant - user is student, role:", user.role);
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Don't render if not authenticated or is admin (will redirect)
  if (!isAuthenticated || !user || user.role === UserRole.ADMIN) {
    return null;
  }

  return <Assistant />;
}
