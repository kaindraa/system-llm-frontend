"use client";

import { memo, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SendIcon } from "lucide-react";

interface ChatInputAreaProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
}

/**
 * Chat Input Area Component
 *
 * Memoized to prevent re-renders when parent component updates
 * This ensures smooth typing experience without lag from parent updates
 */
const ChatInputAreaComponent = ({
  inputValue,
  onInputChange,
  onKeyDown,
  onSubmit,
  disabled = false,
  formRef,
}: ChatInputAreaProps) => {
  return (
    <div className="aui-chat-input-wrapper border-t px-4 py-4">
      <form ref={formRef} onSubmit={onSubmit} className="flex gap-2">
        <textarea
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Send a message... (Shift+Enter for newline)"
          className={cn(
            "flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
            "resize-none",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          rows={2}
          autoFocus
          disabled={disabled}
        />
        <Button
          type="submit"
          disabled={!inputValue.trim() || disabled}
          className="self-end"
        >
          <SendIcon className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export const ChatInputArea = memo(ChatInputAreaComponent);
