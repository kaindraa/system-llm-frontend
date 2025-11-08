import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

export interface Message {
  role: "user" | "assistant";
  content: string | Array<{ type: string; text?: string }>;
  sources?: Array<{
    document_id: string;
    filename?: string;
    document_name?: string;
    page?: number;
    page_number?: number;
    similarity_score?: number;
  }>;
  created_at?: string;
  ragSearched?: boolean;
}

export const useCurrentThread = () => {
  const searchParams = useSearchParams();
  const threadId = searchParams.get("thread");

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load messages for the current thread
  const loadMessages = useCallback(async (conversationId: string) => {
    console.log("[useCurrentThread] Loading messages for thread:", conversationId);
    setIsLoading(true);
    setError(null);
    // Don't clear messages - keep showing old ones while loading new ones to avoid flicker

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        throw new Error("No authentication token");
      }

      // Fetch conversation details including message history from backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1"}/chat/sessions/${conversationId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // If conversation doesn't exist or is empty, just start fresh
        if (response.status === 404) {
          console.log("[useCurrentThread] Conversation not found (404) - starting fresh");
          setMessages([]);
          setError(null);
          setIsLoading(false);
          return;
        }
        throw new Error(`Failed to load messages: ${response.status}`);
      }

      const data = await response.json();
      console.log("[useCurrentThread] Loaded conversation data, messages count:", data.messages?.length || 0);

      // Transform backend messages to format
      if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        const formattedMessages = data.messages.map((msg: {
          role?: string;
          content?: string | Array<{ type?: string; text?: string }>;
          sources?: any[];
          created_at?: string;
          ragSearched?: boolean;
        }) => ({
          role: (msg.role || "user") as "user" | "assistant",
          content:
            typeof msg.content === "string"
              ? msg.content
              : Array.isArray(msg.content)
              ? msg.content
              : "",
          sources: msg.sources || undefined,
          created_at: msg.created_at,
          ragSearched: msg.ragSearched || (msg.sources && msg.sources.length > 0),
        }));
        setMessages(formattedMessages);
      } else {
        console.log("[useCurrentThread] No messages found in conversation");
        setMessages([]);
      }
    } catch (err) {
      console.error("[useCurrentThread] Error loading messages:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load messages when threadId changes
  useEffect(() => {
    if (threadId) {
      console.log("[useCurrentThread] ThreadId changed to:", threadId);
      loadMessages(threadId);
    } else {
      console.log("[useCurrentThread] No threadId - clearing messages and state");
      // No thread selected, start with empty messages
      setMessages([]);
      setIsLoading(false);
      setError(null);
    }
  }, [threadId, loadMessages]);

  return {
    threadId,
    messages,
    isLoading,
    error,
    loadMessages,
  };
};
