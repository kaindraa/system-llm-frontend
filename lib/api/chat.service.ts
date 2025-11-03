import apiClient from "./client";
import {
  ChatSession,
  ChatSessionDetail,
  ChatSessionCreate,
  ChatSessionUpdate,
  SessionListResponse,
  ChatMessage,
} from "@/types/chat";

export const chatService = {
  /**
   * Create a new chat session
   */
  async createSession(data: ChatSessionCreate): Promise<ChatSession> {
    const response = await apiClient.post<ChatSession>("/chat/sessions", data);
    return response.data;
  },

  /**
   * List all chat sessions for the current user
   */
  async listSessions(params?: {
    status_filter?: "active" | "completed";
    limit?: number;
    offset?: number;
  }): Promise<SessionListResponse> {
    const response = await apiClient.get<SessionListResponse>(
      "/chat/sessions",
      { params }
    );
    return response.data;
  },

  /**
   * Get a specific chat session with all messages
   */
  async getSession(sessionId: string): Promise<ChatSessionDetail> {
    const response = await apiClient.get<ChatSessionDetail>(
      `/chat/sessions/${sessionId}`
    );
    return response.data;
  },

  /**
   * Update a chat session
   */
  async updateSession(
    sessionId: string,
    data: ChatSessionUpdate
  ): Promise<ChatSession> {
    const response = await apiClient.patch<ChatSession>(
      `/chat/sessions/${sessionId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a chat session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/chat/sessions/${sessionId}`);
  },

  /**
   * Send a message in a chat session with streaming response
   * Calls the Next.js API route which proxies to the backend
   * Returns an async generator that yields streaming events
   */
  async *sendMessageStream(
    sessionId: string,
    message: string
  ): AsyncGenerator<{
    type: "user_message" | "chunk" | "done" | "error";
    content: { role?: string; content?: string; error?: string };
  }> {
    // Get token from localStorage
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      throw new Error("No authentication token found");
    }

    // Call the Next.js API route instead of backend directly
    const url = "/api/chat";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionId, message }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            const eventType = line.slice(6).trim();
            continue;
          }

          if (line.startsWith("data:")) {
            const data = line.slice(5).trim();
            if (data) {
              try {
                const parsed = JSON.parse(data);

                // Determine event type from the data structure
                let type: "user_message" | "chunk" | "done" | "error";

                if (parsed.error) {
                  type = "error";
                } else if (parsed.role === "user") {
                  type = "user_message";
                } else if (parsed.role === "assistant") {
                  type = "done";
                } else if (parsed.content !== undefined) {
                  type = "chunk";
                } else {
                  continue;
                }

                yield { type, content: parsed };
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
  },
};
