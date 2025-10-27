import { useCallback, useState } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      setIsLoading(true);

      try {
        // Add user message
        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content,
        };
        setMessages((prev) => [...prev, userMessage]);

        // Send to backend
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              ...messages.map((m) => ({
                role: m.role,
                parts: [{ type: "text", text: m.content }],
              })),
              {
                role: "user",
                parts: [{ type: "text", text: content }],
              },
            ],
            sessionId,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        // Get session ID from headers
        const newSessionId = response.headers.get("X-Session-Id");
        if (newSessionId) {
          setSessionId(newSessionId);
        }

        // Read streaming response
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let assistantMessage = "";
        const assistantId = (Date.now() + 1).toString();

        // Add placeholder assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: "",
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data:")) {
              const data = line.slice(5).trim();
              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  if (typeof parsed.content === "string") {
                    assistantMessage += parsed.content;
                    // Update assistant message in real-time
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId
                          ? { ...m, content: assistantMessage }
                          : m
                      )
                    );
                  }
                } catch (e) {
                  console.error("Parse error:", e);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, sessionId]
  );

  return {
    messages,
    isLoading,
    sendMessage,
    sessionId,
  };
}
