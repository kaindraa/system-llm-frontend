import * as React from "react";
import { MessagesSquare } from "lucide-react";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { Separator } from "@/components/ui/separator";

/**
 * Thread List Sidebar Component
 * Displays conversation list in resizable left panel
 * Refactored as simple div (not Sidebar Radix component) for better layout control
 */
export function ThreadListSidebar() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header - system-llm branding */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <MessagesSquare className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">system-llm</span>
          </div>
        </div>
      </div>

      {/* Conversation List - scrollable content */}
      <div className="flex-1 overflow-hidden">
        <ThreadList />
      </div>
    </div>
  );
}
