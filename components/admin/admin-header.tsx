"use client";

import type { FC } from "react";
import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export const AdminHeader: FC = () => {
  const { user } = useAuthStore();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Left side - Empty for symmetry */}
      <div />

      {/* Right side - User info and actions */}
      <div className="flex items-center gap-4">
        {/* User email */}
        {user && (
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        )}

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Logout button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};
