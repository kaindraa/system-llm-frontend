"use client";

import type { FC } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TrashIcon, PlusIcon, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversations } from "@/lib/hooks/useConversations";
import { useCurrentThread } from "@/lib/hooks/useCurrentThread";
import { cn } from "@/lib/utils";

export const ThreadList: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentThreadId = searchParams.get("thread");

  return (
    <div className="aui-root aui-thread-list-root flex flex-col items-stretch gap-1.5">
      {/* New Chat Button */}
      <Button
        className="aui-thread-list-new flex items-center justify-start gap-2 rounded-lg px-2.5 py-2 text-start hover:bg-muted"
        variant="ghost"
        onClick={() => router.push("/")}
      >
        <PlusIcon className="h-4 w-4" />
        <span>New Chat</span>
      </Button>

      {/* Conversations List */}
      <ThreadListItems currentThreadId={currentThreadId} />
    </div>
  );
};

interface ThreadListItemsProps {
  currentThreadId: string | null;
}

const ThreadListItems: FC<ThreadListItemsProps> = ({ currentThreadId }) => {
  const { conversations, isLoading, error } = useConversations();

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
  conversation: {
    id: string;
    title: string;
    status: "active" | "completed";
    updatedAt?: string;
  };
  isActive: boolean;
}

const ThreadListItem: FC<ThreadListItemProps> = ({
  conversation,
  isActive,
}) => {
  const router = useRouter();
  const { delete: deleteConversation } = useConversations();

  const handleNavigate = () => {
    router.push(`/?thread=${conversation.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${conversation.title}"?`)) {
      try {
        await deleteConversation(conversation.id);
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      }
    }
  };

  return (
    <div
      className={cn(
        "aui-thread-list-item group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
        "hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isActive && "bg-muted"
      )}
    >
      {/* Conversation title button */}
      <button
        onClick={handleNavigate}
        className="aui-thread-list-item-trigger flex-grow flex items-center gap-2 text-start"
      >
        <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
        <span className="aui-thread-list-item-title text-sm truncate">
          {conversation.title || "Untitled"}
        </span>
      </button>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="ml-auto p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Delete conversation"
        title="Delete"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
};
