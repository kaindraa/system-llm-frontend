"use client";

import { CheckCircle2Icon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefinedPromptIndicatorProps {
  /** Whether prompt is currently being refined */
  isRefining: boolean;

  /** Original prompt text before refinement */
  originalPrompt?: string;

  /** Error message if refinement failed */
  error?: string;

  /** Optional className for styling */
  className?: string;
}

/**
 * Refined Prompt Indicator Component
 *
 * Displays status when LLM is refining the user's prompt.
 * Similar to RAGSearchIndicator but for prompt refinement.
 *
 * States:
 * - Idle: hidden
 * - Refining: animated loader with dashed border (blue)
 * - Refined: success state with checkmark (green)
 * - Error: error message display (red)
 */
export const RefinedPromptIndicator = ({
  isRefining,
  originalPrompt,
  error,
  className,
}: RefinedPromptIndicatorProps) => {
  // Show if: refining, has error, OR just show indicator (no hide on completion)
  // The result will be shown by RefinedPromptResultComponent
  const shouldShow = isRefining || error;

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
        "transition-all duration-300 ease-in-out",
        // Styling berubah tergantung state
        isRefining
          ? "bg-transparent border border-dashed border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400 opacity-80"
          : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200 opacity-100",
        className
      )}
    >
      {error ? (
        // Error state - red (Refinement failed)
        <>
          <div className="flex-shrink-0">
            <div className="h-4 w-4 rounded-full bg-red-500" />
          </div>
          <span className="text-red-600 dark:text-red-300 text-xs font-medium">
            Refinement failed
          </span>
        </>
      ) : (
        // Refining state - amber dashed
        <>
          <div className="flex-shrink-0">
            <div className="flex gap-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
          <span className="text-xs font-medium">
            Refining prompt
          </span>
        </>
      )}
    </div>
  );
};
