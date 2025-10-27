"use client";

import type { FC } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    name: "Chat",
    href: "/admin/chat",
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    name: "Prompt",
    href: "/admin/prompt",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    name: "File",
    href: "/admin/file",
    icon: <FileText className="h-5 w-5" />,
  },
];

export const AdminSidebar: FC = () => {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Header */}
      <div className="border-b px-4 py-6">
        <h1 className="text-xl font-bold">System LLM</h1>
        <p className="text-xs text-muted-foreground">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className="w-full justify-start gap-3"
              >
                {item.icon}
                <span>{item.name}</span>
              </Button>
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t px-4 py-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
        >
          Logout
        </Button>
      </div>
    </div>
  );
};
