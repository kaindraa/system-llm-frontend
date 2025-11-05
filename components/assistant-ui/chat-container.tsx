"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCurrentThread } from "@/lib/hooks/useCurrentThread";
import { useConversations } from "@/lib/hooks/useConversations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SendIcon, MenuIcon } from "lucide-react";
import { MarkdownRenderer } from "@/components/assistant-ui/markdown-renderer";
import { DocumentSidebar } from "@/components/assistant-ui/document-sidebar";

interface Message {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface Config {
  models: Array<{ id: string; name: string; display_name: string }>;
  active_prompt?: { id: string; name: string };
}

interface ChatContainerProps {
  config?: Config;
  selectedModelName?: string;
}

export const ChatContainer = ({ config, selectedModelName }: ChatContainerProps) => {
  const router = useRouter();
  const { threadId, messages: previousMessages, isLoading } = useCurrentThread();
  const { loadConversations } = useConversations();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const formRef = useRef<HTMLFormElement>(null);

  // Init and cleanup
  useEffect(() => {
    console.log("[ChatContainer] Mounted");
    isMountedRef.current = true;

    // Ensure clean state on mount
    setIsSending(false);
    setIsStreaming(false);
    setIsCreatingConversation(false);

    return () => {
      console.log("[ChatContainer] Unmounting, cleaning up");
      isMountedRef.current = false;
    };
  }, []);

  // When threadId changes, we need to handle message sync properly
  useEffect(() => {
    console.log("[ChatContainer] ThreadId effect triggered. threadId:", threadId);

    // If no threadId, clear messages (new chat mode)
    if (!threadId) {
      console.log("[ChatContainer] No threadId, clearing local messages for new chat");
      setMessages([]);
    } else if (previousMessages) {
      // ThreadId exists, sync with backend messages
      console.log("[ChatContainer] Loading messages for thread:", threadId, "message count:", previousMessages.length);
      const syncedMessages = previousMessages.map((msg) => ({
        role: msg.role,
        content: typeof msg.content === "string" ? msg.content : "",
        created_at: new Date().toISOString(),
      }));
      setMessages(syncedMessages);
      console.log("[ChatContainer] Messages synced, count:", syncedMessages.length);
    } else {
      console.log("[ChatContainer] ThreadId exists but no previousMessages yet (still loading?)");
    }
  }, [threadId, previousMessages]);

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("[ChatContainer] handleSendMessage called. Current state:", {
      isSending,
      isCreatingConversation,
      isStreaming,
      threadId: threadId || "undefined",
      inputLength: inputValue.length,
    });

    // Guard: prevent double submission
    if (isSending || isCreatingConversation) {
      console.warn("[ChatContainer] BLOCKED: Already sending/creating", {
        isSending,
        isCreatingConversation,
      });
      return;
    }

    if (!inputValue.trim()) {
      console.log("[ChatContainer] Empty input, ignoring");
      return;
    }

    const messageContent = inputValue;

    // Add user message immediately
    const userMessage: Message = {
      role: "user",
      content: messageContent,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);
    setIsStreaming(true);

    let activeThreadId = threadId;
    let navigateToThreadId: string | null = null;

    // If no threadId, create conversation first
    if (!threadId) {
      console.log("[ChatContainer] Creating new conversation...");
      setIsCreatingConversation(true);
      try {

        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (!token) {
          throw new Error("No authentication token");
        }

        const title = messageContent.substring(0, 50);

        let modelId = "gpt-4.1-nano";
        if (config && config.models && selectedModelName) {
          const selectedModel = config.models.find(
            (m) => m.display_name === selectedModelName
          );
          modelId = selectedModel?.name || "gpt-4.1-nano";
        }

        const backendUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

        const createResponse = await fetch(`${backendUrl}/chat/sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            model_id: modelId,
          }),
        });

        if (!createResponse.ok) {
          throw new Error("Failed to create conversation");
        }

        const sessionData = await createResponse.json();
        activeThreadId = sessionData.id;
        navigateToThreadId = sessionData.id;

        console.log("[ChatContainer] Conversation created:", activeThreadId);

        // Reload sidebar conversations with loading skeleton
        await loadConversations();
      } catch (error) {
        console.error("[ChatContainer] Error creating conversation:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              error instanceof Error
                ? error.message
                : "Failed to create conversation",
            created_at: new Date().toISOString(),
          },
        ]);
        // Reset all state properly
        setIsSending(false);
        setIsStreaming(false);
        setIsCreatingConversation(false);
        return;
      } finally {
        // Ensure state is reset
        setIsCreatingConversation(false);
      }
    }

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        throw new Error("No authentication token");
      }

      console.log("[ChatContainer] Sending message to session:", activeThreadId);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          threadId: activeThreadId,
          sessionId: activeThreadId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Add empty assistant message
      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Parse streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      try {
        let streamFinished = false;
        while (!streamFinished) {
          console.log("[ChatContainer] Waiting for stream chunk...");
          const { done, value } = await reader.read();

          if (done) {
            console.log("[ChatContainer] Stream done (done=true)");
            break;
          }

          if (!value) {
            console.log("[ChatContainer] No value, continuing...");
            continue;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data:")) {
              const dataStr = line.slice(5).trim();
              if (dataStr) {
                try {
                  const data = JSON.parse(dataStr);

                  if (data.type === "text-delta" && data.textDelta) {
                    assistantContent += data.textDelta;

                    setMessages((prev) => {
                      const updated = [...prev];
                      updated[updated.length - 1] = {
                        ...updated[updated.length - 1],
                        content: assistantContent,
                      };
                      return updated;
                    });
                  }

                  if (data.type === "finish") {
                    console.log("[ChatContainer] Received finish event");
                    streamFinished = true;
                    setIsStreaming(false);
                    break;
                  }
                } catch (parseError) {
                  console.log("[ChatContainer] JSON parse error (ignored):", parseError);
                }
              }
            }
          }

          if (streamFinished) break;
        }
        console.log("[ChatContainer] Streaming loop completed successfully");
      } finally {
        console.log("[ChatContainer] Releasing reader lock");
        reader.releaseLock();
        console.log("[ChatContainer] Reader lock released, exiting stream handler");
      }
    } catch (error) {
      console.error("[ChatContainer] ERROR in send message block:", error);
      console.error("[ChatContainer] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Gagal mengirim pesan. Coba lagi.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      // Reset all sending states
      setIsSending(false);
      setIsStreaming(false);

      // Navigate AFTER everything is done
      if (navigateToThreadId) {
        if (isMountedRef.current) {
          router.push(`/?thread=${navigateToThreadId}`);
        }
      }
    }
  };

  // Handle Enter/Shift+Enter keybinding
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Shift+Enter = newline (default behavior)
        return true;
      } else {
        // Enter = send message
        e.preventDefault();
        e.stopPropagation();

        console.log("[ChatContainer] Enter pressed");

        if (!isSending && !isCreatingConversation && inputValue.trim()) {
          console.log("[ChatContainer] Sending message via Enter key");
          // Submit the form using requestSubmit to trigger proper onSubmit handler
          formRef.current?.requestSubmit();
          return false;
        }

        return false;
      }
    }
  };

  return (
    <div className="aui-root aui-chat-container flex h-full w-full bg-background">
      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header with sidebar toggle */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border lg:hidden">
          <span className="text-sm font-medium">Chat</span>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Toggle documents sidebar"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Messages viewport */}
        <div className="aui-chat-viewport flex flex-1 flex-col overflow-y-auto px-4 py-4">
        {/* Loading indicator */}
        {isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-pulse"></div>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-1 items-center justify-center text-center">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium">Mulai percakapan</p>
              <p className="text-sm">Kirim pesan pertama Anda</p>
            </div>
          </div>
        )}

        {/* Messages list */}
        <div className="flex flex-col gap-4">
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}
        </div>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

        {/* Input area */}
        <div className="aui-chat-input-wrapper border-t px-4 py-4">
          <form ref={formRef} onSubmit={handleSendMessage} className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message... (Shift+Enter for newline)"
              className={cn(
                "flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                "resize-none"
              )}
              rows={2}
              autoFocus
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isSending || isCreatingConversation}
              className="self-end"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Document Sidebar */}
      <DocumentSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[70%] break-words",
          isUser
            ? "bg-muted text-foreground"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        ) : (
          <div className="text-sm">
            <MarkdownRenderer>{message.content}</MarkdownRenderer>
          </div>
        )}
      </div>
    </div>
  );
};
