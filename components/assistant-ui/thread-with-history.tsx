import type { FC } from "react";
import { Thread } from "./thread";
import { useCurrentThread } from "@/lib/hooks/useCurrentThread";
import { cn } from "@/lib/utils";

/**
 * Wrapper component that displays message history + Thread for new messages
 */
export const ThreadWithHistory: FC = () => {
  const { threadId, messages: previousMessages, isLoading } = useCurrentThread();

  return (
    <div className="aui-root aui-thread-root @container flex h-full flex-col bg-background">
      <div className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll px-4">
        {/* Render previous messages - keep visible even while loading */}
        {previousMessages && previousMessages.length > 0 && (
          <PreviousMessages messages={previousMessages} />
        )}

        {/* Show subtle loading indicator if loading and no messages yet */}
        {isLoading && threadId && (!previousMessages || previousMessages.length === 0) && (
          <div className="flex items-center justify-center py-8">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-pulse"></div>
          </div>
        )}

        {/* Render new Thread for live messages and input */}
        {/* Don't show welcome message if we already have previous messages loaded */}
        <Thread hasExistingMessages={previousMessages && previousMessages.length > 0} />
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
