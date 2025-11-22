"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { useCurrentThread } from "@/lib/hooks/useCurrentThread";
import { useConversations } from "@/lib/hooks/useConversations";
import { createConversation } from "@/lib/services/conversation";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/assistant-ui/markdown-renderer";
import { RAGSearchIndicator } from "@/components/assistant-ui/rag-search-indicator";
import { RAGSourceBadges } from "@/components/assistant-ui/rag-source-badges";
import { RefinedPromptIndicator } from "@/components/assistant-ui/refined-prompt-indicator";
import { RefinedPromptResultComponent } from "@/components/assistant-ui/refined-prompt-result";
import { ChatInputArea } from "@/components/assistant-ui/chat-input-area";
import type { RAGSource, RAGSearchState, RefinedPromptState, RefinedPromptResult } from "@/lib/types/rag";

interface ToolCall {
  name: string;
  args: Record<string, any>;
  id?: string;
}

interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  created_at?: string;
  sources?: RAGSource[];
  ragSearched?: boolean;
  refinedPrompt?: RefinedPromptResult;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

interface Config {
  models?: Array<{ id: string; name: string; display_name: string }>;
  active_prompt?: { id: string; name: string; description?: string } | null;
}

interface ChatContainerProps {
  config?: Config | null;
  selectedModelName?: string;
  onSourceClick?: (docId: string, pageNumber: number) => void;
  isSessionEnding?: boolean;
}

export const ChatContainer = ({ config, selectedModelName, onSourceClick, isSessionEnding = false }: ChatContainerProps) => {
  const router = useRouter();
  const { threadId, messages: previousMessages, isLoading } = useCurrentThread();
  const { loadConversations } = useConversations();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [loadingStage, setLoadingStage] = useState<"idle" | "analyzing" | "searching" | "found" | "streaming">("idle");
  const [ragSearchState, setRagSearchState] = useState<RAGSearchState>({
    isSearching: false,
  });
  const [refinedPromptState, setRefinedPromptState] = useState<RefinedPromptState>({
    isRefining: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
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
    } else if (previousMessages && previousMessages.length > 0) {
      // ThreadId exists, sync with backend messages (including sources, tool_calls, refined prompts, and metadata)
      console.log("[ChatContainer] Loading messages for thread:", threadId, "message count:", previousMessages.length);
      console.log("[ChatContainer] previousMessages sample:", {
        userMsg: previousMessages.find(m => m.role === "user"),
        assistantMsg: previousMessages.find(m => m.role === "assistant"),
      });
      const syncedMessages = (previousMessages as unknown as Array<Record<string, unknown>>).map((msg) => {
        const sources = msg.sources as Array<Record<string, unknown>> | undefined;
        const normalizedSources = sources?.map((src) => ({
          document_id: (src.document_id as string) || "",
          document_name: (src.document_name as string) || (src.filename as string) || "Document",
          page_number: Number(src.page_number ?? src.page ?? 1),
          similarity_score: Number(src.similarity_score ?? 0.85),
          chunk_index: src.chunk_index as number | undefined,
        }));

        // Extract tool_calls if present
        const toolCalls = (msg.tool_calls as Array<Record<string, any>> | undefined)?.map((tc) => ({
          name: (tc.name as string) || "",
          args: (tc.args as Record<string, any>) || {},
          id: (tc.id as string) || undefined,
        }));

        // Extract refined prompt if present
        const refinedPrompt = msg.refinedPrompt as Record<string, any> | undefined;
        const normalizedRefinedPrompt = refinedPrompt ? {
          original: (refinedPrompt.original as string) || "",
          refined: (refinedPrompt.refined as string) || "",
          success: (refinedPrompt.success as boolean) !== false,
          error: (refinedPrompt.error as string) || undefined,
        } : undefined;

        return {
          role: (msg.role as "system" | "user" | "assistant" | "tool") || "user",
          content: typeof msg.content === "string" ? msg.content : "",
          created_at: (msg.created_at as string) || new Date().toISOString(),
          sources: normalizedSources,
          ragSearched: (msg.ragSearched as boolean) || false,
          tool_calls: toolCalls,
          tool_call_id: (msg.tool_call_id as string) || undefined,
          refinedPrompt: normalizedRefinedPrompt,
        };
      });
      setMessages(syncedMessages);
      console.log("[ChatContainer] Messages synced, count:", syncedMessages.length, "with sources, tool calls, and refined prompts");
    } else {
      console.log("[ChatContainer] ThreadId exists but no previousMessages yet (still loading?)");
    }
  }, [threadId, previousMessages]);

  // Handle source badge click - notify parent and navigate to document
  const handleSourceClick = useCallback((docId: string, pageNumber: number) => {
    console.log("[ChatContainer] Source clicked:", { docId, pageNumber });
    if (onSourceClick) {
      onSourceClick(docId, pageNumber);
    }
  }, [onSourceClick]);

  // Auto scroll to bottom - only scroll the chat viewport, not the page
  const scrollToBottom = useCallback(() => {
    if (viewportRef.current) {
      // Use requestAnimationFrame for smooth, responsive scrolling
      requestAnimationFrame(() => {
        if (viewportRef.current) {
          viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
        }
      });
    }
  }, []);

  // Scroll whenever messages change (for streaming text animation)
  useEffect(() => {
    // Only scroll if streaming, for better performance
    if (isStreaming) {
      scrollToBottom();
    }
  }, [messages, isStreaming, scrollToBottom]);

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
        const title = messageContent.substring(0, 50);

        let modelId = "gpt-4.1-nano";
        if (config && config.models && selectedModelName) {
          const selectedModel = config.models.find(
            (m) => m.display_name === selectedModelName
          );
          modelId = selectedModel?.name || "gpt-4.1-nano";
        }

        // Use the updated createConversation function that includes user profile and general prompt
        const sessionData = await createConversation(title, modelId);
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
        sources: [],
        ragSearched: false,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Set initial loading stage to "analyzing"
      setLoadingStage("analyzing");
      console.log("[ChatContainer] Loading stage: analyzing");

      // Parse streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";
      let currentSources: RAGSource[] = [];
      let chunkCount = 0; // Track chunk count for logging

      try {
        let streamFinished = false;
        let loopCount = 0;
        while (!streamFinished) {
          loopCount++;
          console.log("[ChatContainer] Loop #" + loopCount + " - Waiting for stream chunk...");
          const { done, value } = await reader.read();

          if (done) {
            console.log("[ChatContainer] ⚠️  Stream done (done=true) but streamFinished=", streamFinished);
            console.log("[ChatContainer] This means 'done' event was never received. Breaking anyway.");
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

                  // Handle refined prompt event
                  if (data.type === "refine_prompt") {
                    console.log("[ChatContainer] Refine prompt event:", data);
                    flushSync(() => {
                      setRefinedPromptState({
                        isRefining: true,
                        originalPrompt: data.content?.original_prompt,
                      });
                    });
                  }

                  // Handle refined prompt result event
                  if (data.type === "refine_prompt_result") {
                    console.log("[ChatContainer] Refine prompt result:", data);
                    const result: RefinedPromptResult = {
                      original: data.content?.original || "",
                      refined: data.content?.refined || "",
                      success: data.content?.success ?? true,
                      error: data.content?.error,
                    };

                    // Update message with refined prompt result immediately
                    flushSync(() => {
                      setMessages((prev) => {
                        const updated = [...prev];
                        if (updated.length > 0) {
                          updated[updated.length - 1] = {
                            ...updated[updated.length - 1],
                            refinedPrompt: result,
                          };
                        }
                        return updated;
                      });
                    });

                    // Keep indicator visible for minimum 1 second, then hide
                    setTimeout(() => {
                      console.log("[ChatContainer] Hiding refine_prompt indicator after 1s");
                      flushSync(() => {
                        setRefinedPromptState({
                          isRefining: false,
                          result,
                        });
                      });
                    }, 1000);
                  }

                  // Handle RAG search event - with synchronous flush for real-time indicator
                  if (data.type === "rag_search") {
                    console.log("[ChatContainer] RAG search:", data.status, "query:", data.query);
                    if (data.status === "searching") {
                      // Update loading stage to "searching"
                      setLoadingStage("searching");
                      console.log("[ChatContainer] Loading stage: searching");

                      // Force synchronous update for real-time indicator display
                      flushSync(() => {
                        setRagSearchState({
                          isSearching: true,
                          query: data.query,
                        });
                      });

                      // Mark message as searched
                      flushSync(() => {
                        setMessages((prev) => {
                          const updated = [...prev];
                          if (updated.length > 0) {
                            updated[updated.length - 1] = {
                              ...updated[updated.length - 1],
                              ragSearched: true,
                            };
                          }
                          return updated;
                        });
                      });
                    } else if (data.status === "completed") {
                      // Add delay to show "searching" stage for minimum 1 second
                      setTimeout(() => {
                        console.log("[ChatContainer] RAG search completed, hiding indicator after 1s");
                        // Hide indicator - results shown via source badges in message
                        flushSync(() => {
                          setRagSearchState((prev) => ({
                            ...prev,
                            isSearching: false,
                            resultsCount: data.results_count,
                            processingTime: data.processing_time,
                          }));
                        });
                      }, 1000);
                    } else if (data.error) {
                      // RAG search error
                      console.log("[ChatContainer] RAG search error:", data.error);
                      setTimeout(() => {
                        flushSync(() => {
                          setRagSearchState((prev) => ({
                            ...prev,
                            isSearching: false,
                            error: data.error,
                          }));
                        });
                      }, 1000);
                    }
                  }

                  // Handle chunk event - with synchronous flush for streaming animation
                  if (data.type === "chunk" && data.content) {
                    chunkCount++;

                    // Update loading stage to "streaming" on first chunk
                    if (chunkCount === 1) {
                      setLoadingStage("streaming");
                      console.log("[ChatContainer] Loading stage: streaming (first chunk received)");
                    }

                    assistantContent += data.content;

                    // Force synchronous render to show streaming text animation (perlahan, smooth)
                    flushSync(() => {
                      setMessages((prev) => {
                        const updated = [...prev];
                        if (updated.length > 0) {
                          updated[updated.length - 1] = {
                            ...updated[updated.length - 1],
                            content: assistantContent,
                          };
                        }
                        return updated;
                      });
                    });
                  }

                  // Handle text delta (old format support) - with synchronous flush
                  if (data.type === "text-delta" && data.textDelta) {
                    assistantContent += data.textDelta;

                    // Force synchronous render for streaming animation
                    flushSync(() => {
                      setMessages((prev) => {
                        const updated = [...prev];
                        if (updated.length > 0) {
                          updated[updated.length - 1] = {
                            ...updated[updated.length - 1],
                            content: assistantContent,
                          };
                        }
                        return updated;
                      });
                    });
                  }

                  // Handle done event with sources and tool_calls
                  if (data.type === "done") {
                    console.log("[ChatContainer] ✅ DONE event received!");
                    console.log("[ChatContainer] Done event data:", data);
                    console.log("[ChatContainer] data.sources:", data.sources);
                    console.log("[ChatContainer] data.tool_calls:", data.tool_calls);

                    // Extract sources from response if available
                    if (data.sources && Array.isArray(data.sources)) {
                      console.log("[ChatContainer] Processing", data.sources.length, "sources from done event");
                      currentSources = (data.sources as Array<Record<string, unknown>>).map((src) => ({
                        document_id: (src.document_id as string) || "",
                        document_name: (src.document_name as string) || (src.filename as string) || "Document",
                        page_number: Number(src.page_number ?? src.page ?? 1),
                        similarity_score: Number(src.similarity_score ?? 0.85),
                      }));
                      console.log("[ChatContainer] Mapped sources:", currentSources);
                    } else {
                      console.log("[ChatContainer] No sources in done event or sources is not array");
                    }

                    // Extract tool_calls if present
                    let toolCallsData: ToolCall[] = [];
                    if (data.tool_calls && Array.isArray(data.tool_calls)) {
                      console.log("[ChatContainer] Processing", data.tool_calls.length, "tool calls from done event");
                      toolCallsData = (data.tool_calls as Array<Record<string, any>>).map((tc) => ({
                        name: (tc.name as string) || "",
                        args: (tc.args as Record<string, any>) || {},
                        id: (tc.id as string) || undefined,
                      }));
                      console.log("[ChatContainer] Mapped tool_calls:", toolCallsData);
                    }

                    // Update final message with sources and tool_calls
                    const finalContent = data.content || assistantContent;
                    setMessages((prev) => {
                      const updated = [...prev];
                      if (updated.length > 0) {
                        updated[updated.length - 1] = {
                          ...updated[updated.length - 1],
                          sources: currentSources,
                          content: finalContent,
                          tool_calls: toolCallsData.length > 0 ? toolCallsData : undefined,
                        };
                      }
                      return updated;
                    });

                    streamFinished = true;
                    console.log("[ChatContainer] streamFinished set to true, breaking loop");
                    setIsStreaming(false);
                    setLoadingStage("idle"); // Reset loading stage
                    setRagSearchState({ isSearching: false });
                    setRefinedPromptState({ isRefining: false });
                    break;
                  }

                  // Handle finish event (old format)
                  if (data.type === "finish") {
                    streamFinished = true;
                    setIsStreaming(false);
                    setLoadingStage("idle"); // Reset loading stage
                    setRagSearchState({ isSearching: false });
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
        try {
          console.log("[ChatContainer] Releasing reader lock (finally block)");
          reader.releaseLock();
          console.log("[ChatContainer] Reader lock released successfully");
        } catch (err) {
          console.log("[ChatContainer] Error releasing reader lock (ignored):", err);
        }
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
      console.log("[ChatContainer] FINALLY BLOCK: Resetting sending/streaming states");
      console.log("[ChatContainer] Before reset - isSending:", isSending, "isStreaming:", isStreaming);

      setIsSending(false);
      setIsStreaming(false);
      setLoadingStage("idle"); // Reset loading stage to idle
      setRefinedPromptState({ isRefining: false }); // Reset refined prompt state

      console.log("[ChatContainer] After reset - states should now be false");

      // Navigate AFTER everything is done
      if (navigateToThreadId) {
        console.log("[ChatContainer] Navigating to thread:", navigateToThreadId);
        if (isMountedRef.current) {
          router.push(`/?thread=${navigateToThreadId}`);
        } else {
          console.log("[ChatContainer] Component unmounted, skipping navigation");
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
    <div className="aui-root aui-chat-container flex h-full w-full bg-background flex-col min-w-0 overflow-hidden">
      {/* Messages viewport */}
      <div
        ref={viewportRef}
        className="aui-chat-viewport flex flex-1 flex-col overflow-y-auto px-4 py-4"
      >
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
          {messages
            .filter((msg) => msg.role !== "system")
            .map((msg, idx) => {
              const isLastMsg = idx === messages.filter((m) => m.role !== "system").length - 1;
              const isAssistant = msg.role === "assistant";

              return (
                <div key={idx}>
                  {/* Message Bubble - ALL content (indicator, text, sources) now inside bubble */}
                  <MessageBubble
                    message={msg}
                    isStreaming={isStreaming && isLastMsg && isAssistant}
                    loadingStage={isLastMsg && isAssistant ? loadingStage : "idle"}
                    ragSearchState={isLastMsg && isAssistant ? ragSearchState : undefined}
                    refinedPromptState={isLastMsg && isAssistant ? refinedPromptState : undefined}
                    onSourceClick={handleSourceClick}
                  />

                  {/* Streaming cursor - shows below bubble while streaming */}
                  {loadingStage === "streaming" && isLastMsg && isAssistant && (
                    <div className="flex items-center gap-1 text-muted-foreground mt-1">
                      <div className="inline-block w-1.5 h-4 bg-primary animate-pulse rounded-sm"></div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - memoized component for smooth typing */}
      <ChatInputArea
        inputValue={inputValue}
        onInputChange={setInputValue}
        onKeyDown={handleKeyDown}
        onSubmit={handleSendMessage}
        disabled={isSending || isCreatingConversation || isSessionEnding}
        formRef={formRef as React.RefObject<HTMLFormElement | null>}
      />
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  hideSourceBadges?: boolean;
  loadingStage?: "idle" | "analyzing" | "searching" | "found" | "streaming";
  ragSearchState?: RAGSearchState;
  refinedPromptState?: RefinedPromptState;
  onSourceClick?: (docId: string, pageNumber: number) => void;
}

const MessageBubbleComponent = ({
  message,
  isStreaming = false,
  loadingStage = "idle",
  ragSearchState,
  refinedPromptState,
  onSourceClick
}: Omit<MessageBubbleProps, 'hideSourceBadges'>) => {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex w-full gap-3 flex-col", isUser ? "items-end" : "items-start")}
    >
      <div
        className={cn(
          "rounded-lg px-4 py-3 max-w-[70%] break-words transition-all duration-200 flex flex-col gap-2",
          isUser
            ? "bg-muted text-foreground"
            : "bg-secondary text-secondary-foreground",
          isStreaming && "shadow-md"
        )}
      >
        {/* SECTION 1: Active Indicator (ONE at a time - priority order) */}
        {!isUser && (
          <>
            {/* Priority 1: Refining Prompt indicator - REPLACES Analyzing */}
            {refinedPromptState?.isRefining && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-transparent border border-dashed border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 opacity-80">
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
                <span className="text-xs font-medium">Refining prompt</span>
              </div>
            )}

            {/* Priority 2: Analyzing indicator - shows if NOT refining and NO refined prompt exists */}
            {!refinedPromptState?.isRefining && !message.refinedPrompt && loadingStage === "analyzing" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-transparent border border-dashed border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
                <span className="text-xs font-medium">Analyzing</span>
              </div>
            )}

            {/* Priority 3: Searching sources indicator */}
            {!refinedPromptState?.isRefining && (loadingStage === "searching" || ragSearchState?.isSearching) && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-transparent border border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 opacity-70">
                <div className="animate-pulse h-4 w-4">
                  <SearchIcon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium">Searching sources</span>
              </div>
            )}

            {/* Priority 3.5: Writing indicator - show when search done but still streaming */}
            {!refinedPromptState?.isRefining && !ragSearchState?.isSearching && isStreaming && loadingStage === "streaming" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-transparent border border-dashed border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 opacity-70">
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
                <span className="text-xs font-medium">Writing</span>
              </div>
            )}

            {/* Priority 4: Completed indicator - show when streaming done and all tools finished */}
            {!isStreaming && loadingStage === "idle" && !refinedPromptState?.isRefining && !ragSearchState?.isSearching && message.content && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                <span className="text-xs font-medium">
                  Completed
                  {(() => {
                    const tools: string[] = [];
                    if (message.refinedPrompt) tools.push("Refine Prompt");
                    if (message.sources && message.sources.length > 0) tools.push("Semantic Search");
                    if (message.tool_calls && message.tool_calls.length > 0) {
                      const toolNames = message.tool_calls.map(tc => tc.name).filter((name, idx, arr) => arr.indexOf(name) === idx);
                      tools.push(...toolNames);
                    }
                    return tools.length > 0 ? `, used ${tools.join(" and ")}` : "";
                  })()}
                </span>
              </div>
            )}
          </>
        )}

        {/* SECTION 2: Refined Prompt Result Box (collapsible) - only show AFTER refining is done */}
        {!isUser && message.refinedPrompt && !refinedPromptState?.isRefining && (
          <RefinedPromptResultComponent result={message.refinedPrompt} />
        )}

        {/* SECTION 3: Message Content */}
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        ) : (
          <div className="text-sm">
            <MarkdownRenderer>{message.content}</MarkdownRenderer>
          </div>
        )}

        {/* SECTION 4: Source Badges with divider and "Found X sources" label */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="pt-2 border-t border-current/20">
            {/* "Found X sources" label */}
            <div className="text-xs text-current opacity-60 font-medium mb-2">
              Found {message.sources.length} source{message.sources.length !== 1 ? "s" : ""}
            </div>
            {/* Source badges */}
            <RAGSourceBadges
              sources={message.sources}
              className="text-xs"
              onSourceClick={onSourceClick}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize MessageBubble to prevent re-renders on parent updates
const MessageBubble = memo(MessageBubbleComponent);
