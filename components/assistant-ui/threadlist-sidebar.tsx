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
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* Header - system-llm branding */}
      <div className="border-b px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex-shrink-0">
            <MessagesSquare className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-semibold truncate">system-llm</span>
          </div>
        </div>
      </div>

      {/* Conversation List - scrollable content with proper overflow handling */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="px-2 py-2">
          <ThreadList />
        </div>
      </div>
    </div>
  );
}
