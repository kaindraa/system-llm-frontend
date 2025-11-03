"use client";

import { useEffect, useState, useRef } from "react";
import { ChatContainer } from "@/components/assistant-ui/chat-container";
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
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { UserMenu } from "@/components/common/user-menu";
import { useCurrentThread } from "@/lib/hooks/useCurrentThread";
import { useConversations } from "@/lib/hooks/useConversations";
import { getPromptName } from "@/lib/services/conversation";
import { ChevronDown } from "lucide-react";

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
  const { threadId } = useCurrentThread();
  const { conversations } = useConversations();
  const [modelName, setModelName] = useState<string>(selectedModelName);
  const [promptName, setPromptName] = useState<string>("-");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current conversation details
  const currentConversation = conversations.find((c) => c.id === threadId);

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
            {/* User menu and theme toggle on the right */}
            <div className="ml-auto flex items-center gap-2">
              <UserMenu />
              <ThemeToggle />
            </div>
          </header>
          <div className="flex-1 overflow-hidden">
            <ChatContainer config={config} selectedModelName={selectedModelName} />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
