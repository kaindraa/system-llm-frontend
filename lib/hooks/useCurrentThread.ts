import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

export interface Message {
  role: "user" | "assistant";
  content: string | Array<{ type: string; text?: string }>;
}

export const useCurrentThread = () => {
  const searchParams = useSearchParams();
  const threadId = searchParams.get("thread");

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load messages for the current thread
  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    setError(null);
    setMessages([]);

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
          setMessages([]);
          return;
        }
        throw new Error(`Failed to load messages: ${response.status}`);
      }

      const data = await response.json();

      // Transform backend messages to @assistant-ui format
      if (data.messages && Array.isArray(data.messages)) {
        const formattedMessages = data.messages.map((msg: any) => ({
          role: msg.role || "user",
          content:
            typeof msg.content === "string"
              ? msg.content
              : msg.content || "",
        }));
        setMessages(formattedMessages);
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
      loadMessages(threadId);
    } else {
      // No thread selected, start with empty messages
      setMessages([]);
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
