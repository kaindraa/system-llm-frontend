"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Assistant } from "./assistant";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types/auth";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, isLoading } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    console.log("[Home] Component mounted, initializing auth...");
    initializeAuth();
  }, [initializeAuth]);

  // Handle redirects after auth is loaded
  useEffect(() => {
    if (isLoading) {
      console.log("[Home] Still loading auth state...");
      return;
    }

    console.log("[Home] Auth loaded:", {
      isAuthenticated,
      user: user?.email,
      role: user?.role,
    });

    // Not authenticated - redirect to login
    if (!isAuthenticated || !user) {
      console.log("[Home] No auth, redirecting to login...");
      router.push("/login");
      return;
    }

    // Admin user - redirect to admin chat
    if (user.role === UserRole.ADMIN) {
      console.log("[Home] User is admin, redirecting to /admin/chat...");
      router.push("/admin/chat");
      return;
    }

    // Student user - ready to show assistant
    console.log("[Home] User is student, showing assistant...");
    setIsReady(true);
  }, [user, isAuthenticated, isLoading, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Redirect in progress (not ready yet)
  if (!isReady) {
    return null;
  }

  // User is authenticated student - show assistant
  return <Assistant />;
}
