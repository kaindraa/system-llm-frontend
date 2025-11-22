"use client";

import type { FC } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlusIcon, RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { listConversations, deleteConversation, type Conversation } from "@/lib/services/conversation";

export const ThreadList: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentThreadId = searchParams.get("thread");

  // Local state - completely independent from useConversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversations on mount only
  useEffect(() => {
    loadConversationsLocal();
  }, []);

  const loadConversationsLocal = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("[ThreadList] Fetching conversations from API...");
      const data = await listConversations();
      const sorted = [...data.sessions].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      console.log("[ThreadList] Fetched and set", sorted.length, "conversations");
      setConversations(sorted);
    } catch (err) {
      console.error("[ThreadList] Error fetching:", err);
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log("[ThreadList] Manual refresh - fetching conversations from DB...");
      await loadConversationsLocal();
      console.log("[ThreadList] Manual refresh complete - conversations updated");
    } catch (error) {
      console.error("[ThreadList] Error during refresh:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Delete "${title}"?`)) {
      try {
        await deleteConversation(id);
        // Remove from local state immediately
        setConversations((prev) => prev.filter((c) => c.id !== id));
        console.log("[ThreadList] Deleted conversation:", id);
      } catch (error) {
        console.error("[ThreadList] Error deleting conversation:", error);
      }
    }
  };

  return (
    <div className="aui-root aui-thread-list-root flex flex-col items-stretch gap-1.5">
      {/* Buttons Row */}
      <div className="flex gap-2">
        {/* New Chat Button */}
        <Button
          className="aui-thread-list-new flex items-center justify-start gap-2 flex-1 rounded-lg px-2.5 py-2 text-start hover:bg-muted"
          variant="ghost"
          onClick={() => router.push("/")}
        >
          <PlusIcon className="h-4 w-4" />
          <span>New Chat</span>
        </Button>

        {/* Refresh Button */}
        <Button
          className="aui-thread-list-refresh flex items-center justify-center gap-2 rounded-lg px-2.5 py-2 hover:bg-muted"
          variant="ghost"
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh conversations from database"
        >
          <RefreshCwIcon className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        </Button>
      </div>

      {/* Conversations List - render directly */}
      <ThreadListItems
        conversations={conversations}
        isLoading={isLoading}
        error={error}
        currentThreadId={currentThreadId}
        onDelete={handleDelete}
      />
    </div>
  );
};

interface ThreadListItemsProps {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  currentThreadId: string | null;
  onDelete: (id: string, title: string) => void;
}

const ThreadListItems: FC<ThreadListItemsProps> = ({ conversations, isLoading, error, currentThreadId, onDelete }) => {

  if (isLoading) {
    return <ThreadListSkeleton />;
  }

  if (error) {
    return (
      <div className="px-3 py-2 text-sm text-destructive">
        Error loading conversations
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground">
        No conversations yet. Start a new chat!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {conversations.map((conversation) => (
        <ThreadListItem
          key={conversation.id}
          conversation={conversation}
          isActive={currentThreadId === conversation.id}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

const ThreadListSkeleton: FC = () => {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          role="status"
          aria-label="Loading conversations"
          aria-live="polite"
          className="aui-thread-list-skeleton-wrapper flex items-center gap-2 rounded-md px-3 py-2"
        >
          <Skeleton className="aui-thread-list-skeleton h-[22px] flex-grow" />
        </div>
      ))}
    </div>
  );
};

interface ThreadListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onDelete: (id: string, title: string) => void;
}

const ThreadListItem: FC<ThreadListItemProps> = ({
  conversation,
  isActive,
  onDelete,
}) => {
  const router = useRouter();

  const handleNavigate = () => {
    router.push(`/?thread=${conversation.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(conversation.id, conversation.title);
  };

  return (
    <div
      className={cn(
        "aui-thread-list-item group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors min-w-0",
        "hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isActive && "bg-muted"
      )}
    >
      {/* Conversation title button */}
      <button
        onClick={handleNavigate}
        className="aui-thread-list-item-trigger flex-grow flex items-center gap-2 text-start min-w-0"
        title={conversation.title || "Untitled"}
      >
        <span className="aui-thread-list-item-title text-sm break-words line-clamp-2 flex-grow">
          {conversation.title || "Untitled"}
        </span>
      </button>
    </div>
  );
};
