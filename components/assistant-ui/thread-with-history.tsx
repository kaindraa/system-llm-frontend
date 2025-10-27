import type { FC } from "react";
import { Thread } from "./thread";
import { useCurrentThread } from "@/lib/hooks/useCurrentThread";
import { cn } from "@/lib/utils";

/**
 * Wrapper component that displays message history + Thread for new messages
 */
export const ThreadWithHistory: FC = () => {
  const { threadId, messages: previousMessages, isLoading } = useCurrentThread();

  // Show loading state while fetching conversation history
  if (isLoading && threadId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground border-t-primary"></div>
          <p className="text-sm text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aui-root aui-thread-root @container flex h-full flex-col bg-background">
      <div className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll px-4">
        {/* Render previous messages */}
        {previousMessages && previousMessages.length > 0 && (
          <PreviousMessages messages={previousMessages} />
        )}

        {/* Render new Thread for live messages and input */}
        <Thread />
      </div>
    </div>
  );
};

interface PreviousMessagesProps {
  messages: Array<{ role: string; content: string | any[] }>;
}

const PreviousMessages: FC<PreviousMessagesProps> = ({ messages }) => {
  return (
    <>
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={cn(
            "mx-auto grid w-full max-w-[var(--thread-max-width)] auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 px-2 py-4",
            msg.role === "user" ? "grid-cols-[minmax(72px,1fr)_auto]" : ""
          )}
          data-role={msg.role}
        >
          <div
            className={cn(
              "rounded-3xl px-5 py-2.5 break-words text-foreground",
              msg.role === "user"
                ? "col-start-2 bg-muted"
                : "col-start-1 col-span-2 bg-background text-foreground"
            )}
          >
            <p className="whitespace-pre-wrap">
              {typeof msg.content === "string"
                ? msg.content
                : Array.isArray(msg.content)
                ? msg.content
                    .filter((c: any) => c.type === "text")
                    .map((c: any) => c.text || "")
                    .join("")
                : ""}
            </p>
          </div>
        </div>
      ))}
    </>
  );
};
