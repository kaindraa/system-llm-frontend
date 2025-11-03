"use client";

import type { FC } from "react";
import { useRef, useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export const UserMenu: FC = () => {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleLogout = () => {
    logout();
  };

  const handleSettings = () => {
    router.push("/settings");
    setIsOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2"
      >
        <div className="flex flex-col items-end gap-0.5 text-xs">
          <p className="font-medium text-foreground">{user.email}</p>
          <p className="text-muted-foreground capitalize">{user.role?.toLowerCase() || "user"}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-md shadow-lg z-50">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground capitalize mt-1">
              {user.role?.toLowerCase() || "user"}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Settings Item */}
            <button
              onClick={handleSettings}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>

            {/* Logout Item */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors border-t border-border mt-1"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
