"use client";

import type { FC } from "react";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Sparkles,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    name: "Chat",
    href: "/admin/chat",
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    name: "Prompt",
    href: "/admin/prompt",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    name: "File",
    href: "/admin/file",
    icon: <FileText className="h-4 w-4" />,
  },
];

export const AdminSidebar: FC = () => {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-muted/30">
      {/* Logo/Branding */}
      <div className="border-b px-6 py-8">
        <div className="space-y-1">
          <h1 className="text-lg font-bold tracking-tight">System LLM</h1>
          <p className="text-xs text-muted-foreground">Admin Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 text-sm",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/10"
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Button>
              </a>
            );
          })}
        </div>
      </nav>

      {/* Footer spacer */}
      <div className="border-t p-4" />
    </aside>
  );
};
