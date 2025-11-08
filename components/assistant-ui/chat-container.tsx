"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { useCurrentThread } from "@/lib/hooks/useCurrentThread";
import { useConversations } from "@/lib/hooks/useConversations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SendIcon, MenuIcon } from "lucide-react";
import { MarkdownRenderer } from "@/components/assistant-ui/markdown-renderer";
import { DocumentSidebar } from "@/components/assistant-ui/document-sidebar";
import { RAGSearchIndicator } from "@/components/assistant-ui/rag-search-indicator";
import { RAGSourceBadges } from "@/components/assistant-ui/rag-source-badges";
import { ChatInputArea } from "@/components/assistant-ui/chat-input-area";
import type { RAGSource, RAGSearchState } from "@/lib/types/rag";

interface Message {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  sources?: RAGSource[];
  ragSearched?: boolean;
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
  const [loadingStage, setLoadingStage] = useState<"idle" | "analyzing" | "searching" | "found" | "streaming">("idle");
  const [ragSearchState, setRagSearchState] = useState<RAGSearchState>({
    isSearching: false,
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
                      // Update loading stage to "found"
                      setLoadingStage("found");
                      console.log("[ChatContainer] Loading stage: found");

                      // Keep indicator visible with "Found X sources" message
                      flushSync(() => {
                        setRagSearchState((prev) => ({
                          ...prev,
                          isSearching: false, // Switch from "Searching..." to "Found X sources"
                          resultsCount: data.results_count,
                          processingTime: data.processing_time,
                        }));
                      });
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

                  // Handle done event with sources
                  if (data.type === "done") {
                    console.log("[ChatContainer] ✅ DONE event received!");
                    // Extract sources from response if available
                    if (data.sources && Array.isArray(data.sources)) {
                      currentSources = data.sources.map((src: any) => ({
                        document_id: src.document_id,
                        document_name: src.filename || src.document_name,
                        page_number: src.page || src.page_number,
                        similarity_score: src.similarity_score || 0.85,
                      }));
                    }

                    // Update final message with sources
                    const finalContent = data.content || assistantContent;
                    setMessages((prev) => {
                      const updated = [...prev];
                      if (updated.length > 0) {
                        updated[updated.length - 1] = {
                          ...updated[updated.length - 1],
                          sources: currentSources,
                          content: finalContent,
                        };
                      }
                      return updated;
                    });

                    streamFinished = true;
                    console.log("[ChatContainer] streamFinished set to true, breaking loop");
                    setIsStreaming(false);
                    setLoadingStage("idle"); // Reset loading stage
                    setRagSearchState({ isSearching: false });
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
    <div className="aui-root aui-chat-container flex h-full w-full bg-background flex-1 min-w-0 overflow-hidden">
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
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} isStreaming={isStreaming && idx === messages.length - 1 && msg.role === "assistant"} />
          ))}
        </div>

        {/* Loading Stage Indicators */}
        {/* 1. Analyzing stage - before RAG or during initial processing */}
        {loadingStage === "analyzing" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex gap-0.5">
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
            <span>Analyzing</span>
          </div>
        )}

        {/* 2. RAG Search Indicator - shows during searching and found stages */}
        {(loadingStage === "searching" || loadingStage === "found") && (
          <div className="flex justify-start max-w-[70%]">
            <RAGSearchIndicator
              isSearching={loadingStage === "searching"}
              query={ragSearchState.query}
              resultsCount={ragSearchState.resultsCount}
              processingTime={ragSearchState.processingTime}
              error={ragSearchState.error}
            />
          </div>
        )}

        {/* 3. Streaming cursor indicator - shows animated cursor while streaming text */}
        {loadingStage === "streaming" && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && (
          <div className="flex items-center gap-1 text-muted-foreground mt-2">
            <div className="inline-block w-1.5 h-4 bg-primary animate-pulse rounded-sm"></div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

        {/* Input area - memoized component for smooth typing */}
        <ChatInputArea
          inputValue={inputValue}
          onInputChange={setInputValue}
          onKeyDown={handleKeyDown}
          onSubmit={handleSendMessage}
          disabled={isSending || isCreatingConversation}
          formRef={formRef}
        />
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
  isStreaming?: boolean;
}

const MessageBubbleComponent = ({ message, isStreaming = false }: MessageBubbleProps) => {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex w-full gap-3 flex-col", isUser ? "items-end" : "items-start")}
    >
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[70%] break-words transition-all duration-200",
          isUser
            ? "bg-muted text-foreground"
            : "bg-secondary text-secondary-foreground",
          isStreaming && "shadow-md" // Add subtle shadow while streaming
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

      {/* RAG Search Indicator and Sources - only for assistant messages */}
      {!isUser && (
        <div className="w-full max-w-[70%]">
          {/* RAG Search Indicator */}
          {message.ragSearched && (
            <RAGSearchIndicator
              isSearching={false}
              query={undefined}
              resultsCount={message.sources?.length || 0}
              className="mb-2"
            />
          )}

          {/* Document Sources */}
          {message.sources && message.sources.length > 0 && (
            <RAGSourceBadges
              sources={message.sources}
              className="text-xs"
            />
          )}
        </div>
      )}
    </div>
  );
};

// Memoize MessageBubble to prevent re-renders on parent updates
const MessageBubble = memo(MessageBubbleComponent);
