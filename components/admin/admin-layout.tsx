"use client";

import type { FC, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types/auth";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { user, isLoading, initializeAuth } = useAuthStore();
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Initialize auth on mount from localStorage
    initializeAuth();
    setAuthInitialized(true);
  }, [initializeAuth]);

  useEffect(() => {
    // Redirect if auth is loaded and user is not admin
    if (authInitialized && !isLoading) {
      if (!user || user.role !== UserRole.ADMIN) {
        console.log("[AdminLayout] Not authorized. User:", user, "Role:", user?.role);
        router.push("/login");
      } else {
        console.log("[AdminLayout] Admin authorized:", user.email);
      }
    }
  }, [user, isLoading, authInitialized, router]);

  // Show loading state while checking auth
  if (!authInitialized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Don't render if not admin
  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <div className="flex h-screen w-full">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header with theme toggle */}
        <AdminHeader />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};
