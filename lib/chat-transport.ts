/**
 * Chat Transport Utilities
 * Handle streaming from backend and session management
 */

let sessionId: string | null = null;

/**
 * Initialize session from localStorage
 */
export function initializeSession(): void {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("chatSessionId");
    if (stored) {
      sessionId = stored;
    }
  }
}

/**
 * Fetch and stream chat response from backend
 * Supports the @assistant-ui/react library format
 */
export async function* streamChatResponse(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>
): AsyncGenerator<string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Add session ID header jika ada
  if (sessionId) {
    headers["X-Session-Id"] = sessionId;
  }

  console.log("Streaming chat with headers:", {
    ...headers,
    Authorization: "***",
  });

  const response = await fetch("/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  // Capture session ID from response header
  const newSessionId = response.headers.get("X-Session-Id");
  if (newSessionId) {
    saveSessionId(newSessionId);
  }

  // Parse SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        // Skip comments and empty lines
        if (line.startsWith(":") || !line.trim()) {
          continue;
        }

        if (line.startsWith("event:")) {
          continue;
        }

        if (line.startsWith("data:")) {
          const data = line.slice(5).trim();
          if (data) {
            try {
              const parsed = JSON.parse(data);

              // Handle different event types from backend
              if (parsed.error) {
                throw new Error(parsed.error);
              } else if (parsed.content && typeof parsed.content === "string") {
                // This is a chunk event - yield the content
                yield parsed.content;
              } else if (
                parsed.role === "assistant" &&
                parsed.content &&
                typeof parsed.content === "string"
              ) {
                // This is a done event with full content
                // Don't yield again as we already yielded chunks
              } else if (parsed.role === "user") {
                // Skip user message echo
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", data, e);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function getSessionId(): string | null {
  return sessionId;
}

export function saveSessionId(id: string): void {
  sessionId = id;
  if (typeof window !== "undefined") {
    localStorage.setItem("chatSessionId", id);
  }
}

export function clearSession(): void {
  sessionId = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("chatSessionId");
  }
}
