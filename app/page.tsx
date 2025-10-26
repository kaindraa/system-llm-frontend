"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Assistant } from "./assistant";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, initializeAuth, isLoading } = useAuthStore();

  useEffect(() => {
    // Initialize auth from localStorage
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Don't render Assistant if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <Assistant />;
}
