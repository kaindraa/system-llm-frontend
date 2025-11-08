"use client";

import { FileIcon, ExternalLinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RAGSource } from "@/lib/types/rag";

interface RAGSourceBadgesProps {
  /** Array of document sources to display */
  sources?: RAGSource[];

  /** Optional className for container styling */
  className?: string;

  /** Callback when a source is clicked */
  onSourceClick?: (source: RAGSource) => void;
}

/**
 * RAGSourceBadges Component
 *
 * Displays document sources retrieved via RAG search.
 * Shows filename, page number, and similarity score for each source.
 *
 * Features:
 * - Compact badge layout
 * - Similarity score visualization
 * - Responsive: wraps on mobile
 * - Clickable for document preview
 */
export const RAGSourceBadges = ({
  sources,
  className,
  onSourceClick,
}: RAGSourceBadgesProps) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  // Remove duplicates by document_id
  const uniqueSources = Array.from(
    new Map(sources.map((s) => [s.document_id, s])).values()
  );

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/50",
        className
      )}
    >
      {uniqueSources.map((source) => (
        <button
          key={`${source.document_id}-${source.page_number}`}
          onClick={() => onSourceClick?.(source)}
          className={cn(
            "group inline-flex items-center gap-1.5",
            "px-2.5 py-1 rounded-full text-xs font-medium",
            "bg-secondary/50 text-secondary-foreground/80",
            "hover:bg-secondary hover:text-secondary-foreground",
            "transition-colors duration-200",
            "border border-secondary/30 hover:border-secondary/60",
            "cursor-pointer"
          )}
          title={`${source.document_name} (Page ${source.page_number})`}
        >
          {/* File Icon */}
          <FileIcon className="h-3 w-3 flex-shrink-0 opacity-70 group-hover:opacity-100" />

          {/* Filename - truncated if too long */}
          <span className="max-w-[120px] truncate">
            {source.document_name}
          </span>

          {/* Page Number */}
          <span className="opacity-70 group-hover:opacity-100">
            p. {source.page_number}
          </span>

          {/* Similarity Score - visual indicator */}
          {source.similarity_score !== undefined && (
            <div className="flex items-center gap-0.5 ml-1">
              <div className="w-6 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    source.similarity_score >= 0.85
                      ? "bg-green-500"
                      : source.similarity_score >= 0.7
                        ? "bg-blue-500"
                        : "bg-yellow-500"
                  )}
                  style={{
                    width: `${Math.round(source.similarity_score * 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs opacity-60">
                {Math.round(source.similarity_score * 100)}%
              </span>
            </div>
          )}

          {/* External link icon on hover */}
          <ExternalLinkIcon className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-70 transition-opacity" />
        </button>
      ))}

      {/* Info text */}
      <div className="w-full text-xs text-muted-foreground mt-1">
        {uniqueSources.length} document{uniqueSources.length !== 1 ? "s" : ""} retrieved from RAG search
      </div>
    </div>
  );
};
