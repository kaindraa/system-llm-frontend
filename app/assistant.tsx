"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  PanelResizeHandle,
  Panel,
  PanelGroup,
} from "react-resizable-panels";
import { ChatContainer } from "@/components/assistant-ui/chat-container";
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
import { DocumentSidebar } from "@/components/assistant-ui/document-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { UserMenu } from "@/components/common/user-menu";
import { useCurrentThread } from "@/lib/hooks/useCurrentThread";
import { useConversations } from "@/lib/hooks/useConversations";
import { useResizablePanelSizes } from "@/lib/hooks/useResizablePanelSizes";
import { getPromptName } from "@/lib/services/conversation";
import { API_BASE_URL } from "@/lib/config";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfigData {
  models: Array<{ id: string; name: string; display_name: string; provider?: string }>;
  active_prompt: { id: string; name: string; description?: string } | null;
}

export const Assistant = () => {
  // Fetch config with models
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [selectedModelName, setSelectedModelName] = useState<string>("GPT-4.1 Nano");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const response = await fetch(`${API_BASE_URL}/chat/config`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setConfig(data);
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

  return (
    <AssistantContent
      config={config}
      selectedModelName={selectedModelName}
      setSelectedModelName={setSelectedModelName}
    />
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
  const router = useRouter();
  const { threadId } = useCurrentThread();
  const { conversations } = useConversations();
  const [modelName, setModelName] = useState<string>(selectedModelName);
  const [promptName, setPromptName] = useState<string>("-");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [selectedSourceDoc, setSelectedSourceDoc] = useState<{ docId: string; pageNumber: number } | null>(null);
  const [docSidebarOpen, setDocSidebarOpen] = useState(true);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState<string | null>(null); // Store threadId of session being ended
  const [isSessionAnalyzed, setIsSessionAnalyzed] = useState(false); // Track if session status is "analyzed"
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { sizes, saveSizes, isLoading: panelSizesLoading } = useResizablePanelSizes();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalyzedStatusRef = useRef<boolean>(false);

  // Get current conversation details
  const currentConversation = conversations.find((c) => c.id === threadId);

  // Reset session states when threadId changes
  useEffect(() => {
    // Reset ending and analyzed states when navigating to different chat
    setIsEndingSession(null);
    setIsSessionAnalyzed(false);
    setShowEndDialog(false);
    lastAnalyzedStatusRef.current = false;
  }, [threadId]);

  // Update model and prompt names based on thread context
  useEffect(() => {
    if (!threadId) {
      setModelName(selectedModelName);
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
      if (config && config.models) {
        const model = config.models.find((m) => m.id === currentConversation.model_id);
        setModelName(model?.display_name || "Unknown Model");
      } else {
        setModelName("Unknown Model");
      }

      if (currentConversation.prompt_id) {
        getPromptName(currentConversation.prompt_id).then((name) => {
          setPromptName(name || "-");
        });
      } else {
        setPromptName("-");
      }
    }
  }, [currentConversation, threadId, config]);

  // Poll session status to detect if admin ended the session
  useEffect(() => {
    if (!threadId) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const pollSessionStatus = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${API_BASE_URL}/chat/sessions/${threadId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Check if session status is "analyzed"
          const isAnalyzed = data.status === "analyzed";
          // Only update state if status changed (avoid unnecessary re-renders)
          if (isAnalyzed !== lastAnalyzedStatusRef.current) {
            lastAnalyzedStatusRef.current = isAnalyzed;
            setIsSessionAnalyzed(isAnalyzed);
            if (isAnalyzed) {
              console.log("[Assistant] Session status: analyzed");
            }
          }
        }
      } catch (error) {
        console.error("[Assistant] Error polling session status:", error);
      }
    };

    // Poll every 5 seconds
    pollSessionStatus();
    pollIntervalRef.current = setInterval(pollSessionStatus, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [threadId, isEndingSession, isSessionAnalyzed]);

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

  const isModelDisabled = !!threadId; // Disable model selection if chat is created

  const handleEndSession = async () => {
    if (!threadId) return;

    setIsEndingSession(threadId);
    setShowEndDialog(false);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      // Call analysis endpoint to end session and analyze
      const analysisResponse = await fetch(`${API_BASE_URL}/chat/sessions/${threadId}/analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!analysisResponse.ok) {
        throw new Error("Failed to end session");
      }

      const analysisData = await analysisResponse.json();
      console.log("[Assistant] Session analysis completed:", analysisData);

      // Redirect after successful closure
      router.push("/");
    } catch (error) {
      console.error("[Assistant] Error ending session:", error);
      alert("Failed to end session. Please try again.");
      setIsEndingSession(null);
    }
  };

  return (
    <div className="flex h-dvh w-full flex-col bg-background">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4">
        {/* Left: System LLM with some spacing */}
        <div className="flex items-center gap-4 ml-10">
          <span className="text-sm font-medium">System LLM</span>
          <Separator orientation="vertical" className="h-4" />
        </div>

        {/* Center: Model, Prompt and Chat button */}
        <div className="flex flex-1 justify-center items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            {/* Model selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => !isModelDisabled && setShowModelDropdown(!showModelDropdown)}
                disabled={isModelDisabled}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  isModelDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-muted cursor-pointer"
                }`}
              >
                <span>Model = {modelName}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* Model Dropdown Menu */}
              {showModelDropdown && !isModelDisabled && config && config.models && config.models.length > 0 && (
                <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-md z-50 w-56">
                  {config.models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleModelSelect(model.display_name)}
                      title={model.display_name}
                      className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors truncate ${
                        modelName === model.display_name ? "bg-muted" : ""
                      }`}
                    >
                      {model.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Separator */}
            <Separator orientation="vertical" className="h-4 bg-border" />

            {/* Prompt display */}
            <span className="text-sm">Prompt = {promptName}</span>

            {/* Separator before Chat button */}
            {threadId && <Separator orientation="vertical" className="h-4 bg-border" />}

            {/* End Chat button */}
            {threadId && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowEndDialog(true)}
                disabled={isEndingSession === threadId || isSessionAnalyzed}
              >
                {isEndingSession === threadId ? "Ending..." : isSessionAnalyzed ? "Chat Ended" : "End Chat"}
              </Button>
            )}
          </div>
        </div>

        {/* Right: User menu and theme toggle */}
        <div className="ml-auto flex items-center gap-2">
          <Separator orientation="vertical" className="h-4" />
          <UserMenu />
          <ThemeToggle />
        </div>
      </header>

      {/* End Chat Dialog */}
      <Dialog open={showEndDialog} onOpenChange={(open) => {
        // Prevent closing dialog while ending session
        if (isEndingSession === null) {
          setShowEndDialog(open);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Chat?</DialogTitle>
            <DialogDescription>
              Once you end this chat, it cannot be resumed. The session will be analyzed and you will not be able to continue the conversation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEndDialog(false)}
              disabled={isEndingSession !== null}
            >
              Continue
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndSession}
              disabled={isEndingSession !== null}
            >
              {isEndingSession !== null ? "Ending..." : "End Chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main layout with resizable panels */}
      {!panelSizesLoading && (
        <PanelGroup
          direction="horizontal"
          onLayout={(newSizes) => {
            saveSizes({
              left: newSizes[0],
              center: newSizes[1],
              right: newSizes[2],
            });
          }}
          className="flex-1 overflow-hidden"
        >
          {/* Left Panel - Thread List Sidebar */}
          <Panel defaultSize={sizes.left} minSize={15} maxSize={40}>
            <ThreadListSidebar />
          </Panel>

          {/* Resize Handle between left and center */}
          <PanelResizeHandle className="bg-border hover:bg-primary/20 transition-colors w-1" />

          {/* Center Panel - Chat Container */}
          <Panel defaultSize={sizes.center} minSize={30} maxSize={70}>
            <div className={`h-full transition-opacity duration-300 ${threadId && (isEndingSession === threadId || isSessionAnalyzed) ? "opacity-50 pointer-events-none" : ""}`}>
              <ChatContainer
                config={config}
                selectedModelName={selectedModelName}
                onSourceClick={(docId, pageNumber) => {
                  setSelectedSourceDoc({ docId, pageNumber });
                  setDocSidebarOpen(true);
                }}
                isSessionEnding={threadId && (isEndingSession === threadId || isSessionAnalyzed)}
              />
            </div>
          </Panel>

          {/* Resize Handle between center and right */}
          <PanelResizeHandle className="bg-border hover:bg-primary/20 transition-colors w-1" />

          {/* Right Panel - Document Viewer */}
          <Panel defaultSize={sizes.right} minSize={0} maxSize={40} collapsible>
            <DocumentSidebar
              isOpen={docSidebarOpen}
              onClose={() => setDocSidebarOpen(false)}
              selectedSourceDoc={selectedSourceDoc}
              onSourceSelected={() => setSelectedSourceDoc(null)}
            />
          </Panel>
        </PanelGroup>
      )}
    </div>
  );
};
