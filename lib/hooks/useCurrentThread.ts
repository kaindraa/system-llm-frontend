import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

export interface ToolCall {
  name: string;
  args: Record<string, any>;
  id?: string;
}

export interface Source {
  document_id: string;
  filename?: string;
  document_name?: string;
  page?: number;
  page_number?: number;
  similarity_score?: number;
}

export interface RefinedPromptResult {
  original: string;
  refined: string;
  success: boolean;
  error?: string;
}

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string | Array<{ type: string; text?: string }>;
  sources?: Source[];
  created_at?: string;
  ragSearched?: boolean;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  refinedPrompt?: RefinedPromptResult;
}

/**
 * Helper function to parse real_messages and extract refined prompt + tools info
 * real_messages structure:
 * [
 *   { role: "assistant", tool_calls: [{name: "refine_prompt", ...}] },
 *   { role: "tool", content: {original, refined, success}, tool_call_id: "..." },
 *   { role: "assistant", tool_calls: [{name: "semantic_search", ...}] },
 *   { role: "tool", content: {chunks, sources, ...}, tool_call_id: "..." },
 *   { role: "assistant", content: "...", sources: [...] }
 * ]
 */
function parseRealMessages(rawMessages: any[]): Message[] {
  console.log("[parseRealMessages] Starting parse with", rawMessages.length, "raw messages");

  // Build a map of tool_call_id -> tool message content for quick lookup
  const toolResultsMap = new Map<string, any>();
  rawMessages.forEach((msg, idx) => {
    if (msg.role === "tool" && msg.tool_call_id) {
      try {
        // Tool message content is JSON string
        const parsedContent = typeof msg.content === "string" ? JSON.parse(msg.content) : msg.content;
        toolResultsMap.set(msg.tool_call_id, parsedContent);
        console.log(`[parseRealMessages] Tool message #${idx} (${msg.tool_call_id}):`, {
          hasRefined: "refined" in parsedContent,
          hasSources: "sources" in parsedContent,
          keys: Object.keys(parsedContent),
        });
      } catch (e) {
        console.log("[parseRealMessages] Failed to parse tool message content at #" + idx + ":", msg.content, e);
      }
    }
  });

  console.log("[parseRealMessages] Built toolResultsMap with", toolResultsMap.size, "entries");

  // First pass: collect refined prompt from tool results
  let refinedPromptData: RefinedPromptResult | undefined;
  Array.from(toolResultsMap.values()).forEach((result) => {
    if (result && typeof result === "object" && "refined" in result) {
      console.log("[parseRealMessages] Found refined prompt in tool results");
      refinedPromptData = {
        original: result.original || "",
        refined: result.refined || "",
        success: result.success !== false,
        error: result.error,
      };
    }
  });

  // Process messages
  const formattedMessages: Message[] = [];
  rawMessages.forEach((msg, idx) => {
    // Only include user, assistant messages (not system or tool)
    if (msg.role === "system" || msg.role === "tool") {
      console.log(`[parseRealMessages] Skipping message #${idx} (role: ${msg.role})`);
      return; // Skip system and tool messages in final output
    }

    const baseMsg: Message = {
      role: (msg.role || "user") as "system" | "user" | "assistant" | "tool",
      content: typeof msg.content === "string" ? msg.content : "",
      sources: msg.sources,
      created_at: msg.created_at,
      ragSearched: msg.ragSearched || (msg.sources && msg.sources.length > 0),
      tool_calls: msg.tool_calls,
      tool_call_id: msg.tool_call_id,
    };

    // Attach refined prompt to LAST assistant message (the one with actual content)
    if (msg.role === "assistant" && msg.content && refinedPromptData) {
      console.log(`[parseRealMessages] Attaching refinedPrompt to final assistant message #${idx}`);
      baseMsg.refinedPrompt = refinedPromptData;
    }

    console.log(`[parseRealMessages] Including message #${idx}:`, {
      role: baseMsg.role,
      contentLength: baseMsg.content.length,
      hasSources: !!baseMsg.sources?.length,
      hasToolCalls: !!baseMsg.tool_calls?.length,
      hasRefinedPrompt: !!baseMsg.refinedPrompt,
    });

    formattedMessages.push(baseMsg);
  });

  console.log("[parseRealMessages] Final formatted messages:", formattedMessages.length);

  // Log example user and assistant message
  const userMsg = formattedMessages.find(m => m.role === "user");
  const assistantMsg = formattedMessages.find(m => m.role === "assistant");

  if (userMsg) {
    console.log("[parseRealMessages] Example USER message:", {
      content: userMsg.content?.substring(0, 100),
      created_at: userMsg.created_at,
    });
  }

  if (assistantMsg) {
    console.log("[parseRealMessages] Example ASSISTANT message:", {
      content: assistantMsg.content?.substring(0, 100),
      sources: assistantMsg.sources?.map(s => ({ document_name: s.document_name, page: s.page_number })),
      toolCalls: assistantMsg.tool_calls?.map(tc => ({ name: tc.name, argsKeys: Object.keys(tc.args) })),
      refinedPrompt: assistantMsg.refinedPrompt ? {
        original: assistantMsg.refinedPrompt.original.substring(0, 50),
        refined: assistantMsg.refinedPrompt.refined.substring(0, 50),
      } : null,
    });
  }

  return formattedMessages;
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

      // Use real_messages for full format with tool calls, refined prompts, and sources
      const messagesData = data.real_messages || data.messages || [];
      console.log("[useCurrentThread] Loaded conversation data, real_messages count:", messagesData.length);

      // Transform backend messages using helper function
      if (messagesData && Array.isArray(messagesData) && messagesData.length > 0) {
        const formattedMessages = parseRealMessages(messagesData);
        console.log("[useCurrentThread] Parsed messages count:", formattedMessages.length, "with refined prompts and tool calls");
        setMessages(formattedMessages);
      } else {
        console.log("[useCurrentThread] No real_messages found in conversation");
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
