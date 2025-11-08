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
 * Shows animated indicator while searching, then displays results summary.
 *
 * States:
 * - Idle: hidden
 * - Searching: animated loader with query
 * - Found: success state with result count and processing time
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
  const [showIndicator, setShowIndicator] = useState(false);

  // Small delay to avoid flickering on very fast searches
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIndicator(isSearching);
    }, 100);

    return () => clearTimeout(timer);
  }, [isSearching]);

  if (!showIndicator && !error) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
        "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
        "transition-all duration-300 ease-in-out",
        className
      )}
    >
      {error ? (
        // Error state
        <>
          <div className="flex-shrink-0">
            <div className="h-4 w-4 rounded-full bg-red-400 dark:bg-red-500" />
          </div>
          <span className="text-red-600 dark:text-red-300 text-xs font-medium">
            Search failed: {error}
          </span>
        </>
      ) : isSearching ? (
        // Loading state
        <>
          <div className="flex-shrink-0">
            <div className="relative h-4 w-4">
              <SearchIcon className="h-4 w-4 animate-pulse" />
            </div>
          </div>
          <span className="text-xs font-medium">
            Searching documents
            {query && <span className="opacity-70">: "{query.substring(0, 50)}{query.length > 50 ? "..." : ""}"</span>}
          </span>
        </>
      ) : (
        // Found state
        <>
          <div className="flex-shrink-0">
            <CheckCircle2Icon className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-xs font-medium">
            Found {resultsCount || 0} source{(resultsCount || 0) !== 1 ? "s" : ""}
            {processingTime && <span className="opacity-70"> in {(processingTime / 1000).toFixed(2)}s</span>}
          </span>
        </>
      )}
    </div>
  );
};
