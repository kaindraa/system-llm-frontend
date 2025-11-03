"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCurrentThread } from "@/lib/hooks/useCurrentThread";
import { useConversations } from "@/lib/hooks/useConversations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SendIcon } from "lucide-react";

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
  const { conversations } = useConversations();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update messages when previousMessages change (conversation switch)
  useEffect(() => {
    if (previousMessages && previousMessages.length > 0) {
      setMessages(
        previousMessages.map((msg) => ({
          role: msg.role,
          content: typeof msg.content === "string" ? msg.content : "",
          created_at: new Date().toISOString(),
        }))
      );
    } else {
      setMessages([]);
    }
  }, [previousMessages, threadId]);

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) {
      return;
    }

    // If no threadId, create conversation first
    let activeThreadId = threadId;
    if (!threadId) {
      setIsCreatingConversation(true);
      try {
        console.log("[ChatContainer] Creating new conversation");

        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (!token) {
          throw new Error("No authentication token");
        }

        // Extract title from first message
        const title = inputValue.substring(0, 50);

        // Find selected model
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

        console.log("[ChatContainer] Conversation created:", activeThreadId);

        // Navigate to new conversation
        router.push(`/?thread=${activeThreadId}`);
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
        setIsCreatingConversation(false);
        return;
      } finally {
        setIsCreatingConversation(false);
      }
    }

    const userMessage: Message = {
      role: "user",
      content: inputValue,
      created_at: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);
    setIsStreaming(true);

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

      // Parse streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      // Add empty assistant message to show it's typing
      let assistantMessage: Message = {
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

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

                  // Handle text-delta events (streaming chunks)
                  if (data.type === "text-delta" && data.textDelta) {
                    assistantContent += data.textDelta;

                    // Update assistant message in real-time
                    setMessages((prev) => {
                      const updated = [...prev];
                      updated[updated.length - 1] = {
                        ...updated[updated.length - 1],
                        content: assistantContent,
                      };
                      return updated;
                    });
                  }

                  // Handle finish event
                  if (data.type === "finish") {
                    console.log("[ChatContainer] Streaming finished");
                    setIsStreaming(false);
                  }
                } catch {
                  // Silently ignore parsing errors
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
        setIsStreaming(false);
      }
    } catch (error) {
      console.error("[ChatContainer] Error sending message:", error);
      // Add error message
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
      setIsSending(false);
    }
  };

  return (
    <div className="aui-root aui-chat-container flex h-full w-full flex-col bg-background">
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
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Send a message..."
            className={cn(
              "flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
              "resize-none"
            )}
            rows={2}
            disabled={isSending || isCreatingConversation}
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
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
      </div>
    </div>
  );
};
