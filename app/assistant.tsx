"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useLocalRuntime } from "@assistant-ui/react";
import { ThreadWithHistory } from "@/components/assistant-ui/thread-with-history";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { initializeSession } from "@/lib/chat-transport";
import { useCurrentThread } from "@/lib/hooks/useCurrentThread";
import { useConversations } from "@/lib/hooks/useConversations";
import { trimTitle } from "@/lib/utils";
import { getPromptName } from "@/lib/services/conversation";
import { ChevronDown } from "lucide-react";

interface ConfigData {
  models: Array<{ id: string; name: string; display_name: string; provider?: string }>;
  active_prompt: { id: string; name: string; description?: string } | null;
}

export const Assistant = () => {
  // Initialize session from localStorage on mount
  useEffect(() => {
    initializeSession();
  }, []);

  // Get threadId and conversations
  const { threadId } = useCurrentThread();
  const { conversations, loadConversations } = useConversations();

  // Use for updating URL when new session created
  const router = useRouter();

  // Fetch and store config for use in runtime
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [selectedModelName, setSelectedModelName] = useState<string>("GPT-4.1 Nano");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

        const response = await fetch(`${backendUrl}/chat/config`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setConfig(data);
          // Set initial selected model to first model
          if (data.models && data.models.length > 0) {
            setSelectedModelName(data.models[0].display_name);
          }
        }
      } catch (error) {
        console.error("[Assistant] Error fetching config:", error);
      }
    };
    fetchConfig();
  }, []);

  // Check if current threadId is a real conversation
  const isRealThread = threadId && conversations.some((c) => c.id === threadId);

  const runtime = useLocalRuntime({
    async *run({ messages, abortSignal }) {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        throw new Error("No authentication token");
      }

      // DEBUG: Log what token is in localStorage
      console.log("[Assistant Runtime] Token from localStorage:");
      console.log("[Assistant Runtime] Token length:", token?.length);
      console.log("[Assistant Runtime] Token first 50:", token?.substring(0, 50));
      console.log("[Assistant Runtime] Full token:", token);

      // Try to decode payload without verification to see what's inside
      if (token) {
        const parts = token.split('.');
        if (parts.length === 3) {
          try {
            const payload = JSON.parse(atob(parts[1]));
            console.log("[Assistant Runtime] Token payload:", payload);
            console.log("[Assistant Runtime] Has user_id?:", 'user_id' in payload);
            console.log("[Assistant Runtime] Has id?:", 'id' in payload);
            console.log("[Assistant Runtime] Has email?:", 'email' in payload);
            console.log("[Assistant Runtime] Has role?:", 'role' in payload);
          } catch (e) {
            console.log("[Assistant Runtime] Could not decode payload:", e);
          }
        } else {
          console.log("[Assistant Runtime] Token does not have 3 parts, has:", parts.length);
        }
      }

      let sessionId = threadId;

      // If it's a new conversation (no threadId or not in conversations), create it first
      if (!isRealThread && !threadId) {
        console.log("[Assistant] Creating new conversation before sending message");

        // Extract first user message as title
        let title = "New Chat";
        if (messages && messages.length > 0) {
          const firstUserMessage = messages.find((msg: any) => msg.role === "user");
          if (firstUserMessage) {
            let messageText = "";
            if (typeof firstUserMessage.content === "string") {
              messageText = firstUserMessage.content;
            } else if (Array.isArray(firstUserMessage.content)) {
              messageText = (firstUserMessage.content as Array<{ type: string; text?: string }>)
                .filter((c) => c.type === "text")
                .map((c) => c.text || "")
                .join(" ");
            }
            if (messageText) {
              title = trimTitle(messageText, 50);
            }
          }
        }

        // Create conversation using selected model and active prompt
        try {
          const backendUrl =
            process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
          // Find the model by display name that was selected
          let selectedModel = config?.models?.[0];
          if (config && config.models && selectedModelName) {
            selectedModel = config.models.find((m) => m.display_name === selectedModelName);
          }
          const modelId = selectedModel?.name || "gpt-4.1-nano";
          const promptId = config?.active_prompt?.id;

          const createBody: any = {
            model_id: modelId,
            title: title,
          };
          if (promptId) {
            createBody.prompt_id = promptId;
          }

          const createResponse = await fetch(`${backendUrl}/chat/sessions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(createBody),
          });

          if (!createResponse.ok) {
            throw new Error("Failed to create conversation");
          }

          const sessionData = await createResponse.json();
          sessionId = sessionData.id;
          console.log("[Assistant] Conversation created:", sessionId);

          // Navigate to new conversation
          router.push(`/?thread=${sessionId}`);
          loadConversations();
        } catch (error) {
          console.error("[Assistant] Failed to create conversation:", error);
          throw error;
        }
      }

      // Prepare request body for sending message
      const requestBody: any = { messages };
      if (sessionId) {
        requestBody.threadId = sessionId;
        requestBody.sessionId = sessionId;
      }

      // DEBUG: Log token and request details
      console.log("[Assistant] Sending message request:");
      console.log("[Assistant] Token:", token ? `${token.substring(0, 20)}...` : "NO TOKEN");
      console.log("[Assistant] SessionId:", sessionId);
      console.log("[Assistant] Request body:", requestBody);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
        signal: abortSignal,
      });

      console.log("[Assistant] Response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.log("[Assistant] Error response:", errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          if (!response.body) {
            throw new Error("No response body");
          }

          // Parse SSE and stream content in real-time
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let text = "";

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

                      // Yield text-delta events immediately for real-time streaming
                      if (data.type === "text-delta" && data.textDelta) {
                        text += data.textDelta;
                        yield {
                          content: [
                            {
                              type: "text",
                              text: text,
                            },
                          ],
                        };
                      }

                      // Handle finish event to complete streaming
                      if (data.type === "finish") {
                        console.log("[streaming] Finished, final text:", text);
                        return; // Exit generator to signal completion
                      }
                    } catch (e) {
                      // Silently ignore parsing errors
                    }
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        },
      });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AssistantContent
        config={config}
        selectedModelName={selectedModelName}
        setSelectedModelName={setSelectedModelName}
      />
    </AssistantRuntimeProvider>
  );
};

interface AssistantContentProps {
  config: ConfigData | null;
  selectedModelName: string;
  setSelectedModelName: React.Dispatch<React.SetStateAction<string>>;
}

const AssistantContent = ({
  config,
  selectedModelName,
  setSelectedModelName,
}: AssistantContentProps) => {
  const { threadId } = useCurrentThread();
  const { conversations } = useConversations();
  const [promptName, setPromptName] = useState<string>("-");
  const [modelName, setModelName] = useState<string>(selectedModelName);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current conversation details
  const currentConversation = conversations.find((c) => c.id === threadId);

  // Update model name when at root (no threadId) - use selected model from parent
  useEffect(() => {
    if (!threadId) {
      setModelName(selectedModelName);
      // Use active prompt name if available
      if (config?.active_prompt) {
        setPromptName(config.active_prompt.name);
      } else {
        setPromptName("-");
      }
    }
  }, [threadId, selectedModelName, config]);

  // When at a conversation, show conversation's model and prompt
  useEffect(() => {
    if (currentConversation && threadId) {
      // Set model name from conversation (model_id is UUID)
      if (config && config.models) {
        const model = config.models.find((m) => m.id === currentConversation.model_id);
        setModelName(model?.display_name || "Unknown Model");
      } else {
        setModelName("Unknown Model");
      }

      // Fetch prompt name from prompt_id
      if (currentConversation.prompt_id) {
        getPromptName(currentConversation.prompt_id).then((name) => {
          setPromptName(name || "-");
        });
      } else {
        setPromptName("-");
      }
    }
  }, [currentConversation, threadId, config]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };

    if (showModelDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showModelDropdown]);

  const handleModelSelect = (displayName: string) => {
    setSelectedModelName(displayName);
    setModelName(displayName);
    setShowModelDropdown(false);
  };

  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full pr-0.5">
        <ThreadListSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:flex items-center gap-2">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowModelDropdown(!showModelDropdown)}
                      className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors"
                    >
                      <span>Model = {modelName}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>

                    {/* Model Dropdown Menu */}
                    {showModelDropdown && config && config.models && config.models.length > 0 && (
                      <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-md z-50 min-w-max">
                        {config.models.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => handleModelSelect(model.display_name)}
                            className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors ${
                              modelName === model.display_name ? "bg-muted" : ""
                            }`}
                          >
                            {model.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Prompt = {promptName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            {/* Theme toggle on the right */}
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </header>
          <div className="flex-1 overflow-hidden">
            <ThreadWithHistory />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
