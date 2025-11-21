"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SearchIcon, CheckCircle2Icon } from "lucide-react";

interface RAGSearchIndicatorProps {
  /** Whether search is currently in progress */
  isSearching: boolean;

  /** Search query being executed */
  query?: string;

  /** Number of results found */
  resultsCount?: number;

  /** Processing time in milliseconds */
  processingTime?: number;

  /** Error message if search failed */
  error?: string;

  /** Optional className for styling */
  className?: string;
}

/**
 * RAGSearchIndicator Component
 *
 * Displays loading state when LLM is searching documents via RAG tool.
 * Shows animated indicator ONLY while searching, then hides automatically.
 * Found results are shown via source badges instead.
 *
 * States:
 * - Idle: hidden
 * - Searching documents: animated loader with query
 * - Auto-hides when search completes
 * - Error: error message display
 */
export const RAGSearchIndicator = ({
  isSearching,
  query,
  resultsCount,
  processingTime,
  error,
  className,
}: RAGSearchIndicatorProps) => {
  // Show ONLY if: actively searching OR has error
  // Hide automatically once search completes (no "Found X sources" state here)
  const shouldShow = isSearching || error;

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
        "transition-all duration-300 ease-in-out",
        // Styling berubah tergantung state
        isSearching
          ? "bg-transparent border border-dashed border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400 opacity-70"
          : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200 opacity-100",
        className
      )}
    >
      {error ? (
        // Error state - red (Search failed)
        <>
          <div className="flex-shrink-0">
            <div className="h-4 w-4 rounded-full bg-red-500" />
          </div>
          <span className="text-red-600 dark:text-red-300 text-xs font-medium">
            Searching sources failed
          </span>
        </>
      ) : (
        // Searching state - blue dashed
        <>
          <div className="flex-shrink-0">
            <SearchIcon className="h-4 w-4 animate-pulse" />
          </div>
          <span className="text-xs font-medium">
            Searching sources
          </span>
        </>
      )}
    </div>
  );
};
