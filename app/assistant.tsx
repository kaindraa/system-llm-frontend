"use client";

import { useEffect } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useLocalRuntime } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { initializeSession } from "@/lib/chat-transport";

export const Assistant = () => {
  // Initialize session from localStorage on mount
  useEffect(() => {
    initializeSession();
  }, []);

  const runtime = useLocalRuntime({
    async run({ messages, abortSignal }) {
      console.log("[useLocalRuntime] run() called with messages:", messages);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        throw new Error("No authentication token");
      }

      console.log("[useLocalRuntime] Sending request to /api/chat");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages }),
        signal: abortSignal,
      });

      console.log("[useLocalRuntime] Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let contentBuffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data:")) {
              const dataStr = line.slice(5).trim();
              if (dataStr) {
                try {
                  const data = JSON.parse(dataStr);

                  // Handle text-delta events
                  if (data.type === "text-delta" && data.textDelta) {
                    contentBuffer += data.textDelta;
                  }

                  // Handle finish events
                  if (data.type === "finish") {
                    // Return the full accumulated content
                    console.log("[useLocalRuntime] Received finish event, returning:", contentBuffer);
                    return { text: contentBuffer };
                  }
                } catch (e) {
                  // Silently ignore parsing errors
                }
              }
            }
          }
        }

        // If stream ended without explicit finish, return what we have
        console.log("[useLocalRuntime] Stream ended, returning:", contentBuffer);
        return { text: contentBuffer };
      } finally {
        reader.releaseLock();
      }
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <div className="flex h-dvh w-full pr-0.5">
          <ThreadListSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink
                      href="https://www.assistant-ui.com/docs/getting-started"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Build Your Own ChatGPT UX
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Starter Template</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              {/* Theme toggle on the right */}
              <div className="ml-auto">
                <ThemeToggle />
              </div>
            </header>
            <div className="flex-1 overflow-hidden">
              <Thread />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};
