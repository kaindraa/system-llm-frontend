import { useCallback } from "react";
import type { FC } from "react";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversations } from "@/lib/hooks/useConversations";

export const ThreadList: FC = () => {
  const router = useRouter();
  const { conversations, isLoading } = useConversations();

  const handleNewThread = useCallback(() => {
    console.log("[ThreadList] Starting new conversation");
    // Just navigate to root - will stay empty until first message sent
    // Then conversation will be created with title from first message
    router.push("/");
  }, [router]);

  return (
    <div className="aui-root aui-thread-list-root flex flex-col items-stretch gap-1.5">
      <Button
        onClick={handleNewThread}
        className="aui-thread-list-new flex items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start hover:bg-muted data-active:bg-muted"
        variant="ghost"
      >
        <PlusIcon className="size-4" />
        New Chat
      </Button>

      <ThreadListItems conversations={conversations} isLoading={isLoading} />
    </div>
  );
};

interface ThreadListItemsProps {
  conversations: Array<{ id: string; title: string }>;
  isLoading: boolean;
}

const ThreadListItems: FC<ThreadListItemsProps> = ({
  conversations,
  isLoading,
}) => {
  // Show skeleton loading state
  if (isLoading) {
    return <ThreadListSkeleton />;
  }

  // Show empty state
  if (!conversations || conversations.length === 0) {
    return (
      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
        No conversations yet. Create one to get started.
      </div>
    );
  }

  // Render conversations from the backend
  return (
    <div className="flex flex-col gap-1">
      {conversations.map((conversation) => (
        <a
          key={conversation.id}
          href={`/?thread=${conversation.id}`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted"
        >
          <span className="flex-1 truncate">{conversation.title}</span>
        </a>
      ))}
    </div>
  );
};

const ThreadListSkeleton: FC = () => {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          role="status"
          aria-label="Loading threads"
          aria-live="polite"
          className="aui-thread-list-skeleton-wrapper flex items-center gap-2 rounded-md px-3 py-2"
        >
          <Skeleton className="aui-thread-list-skeleton h-[22px] flex-grow" />
        </div>
      ))}
    </>
  );
};
