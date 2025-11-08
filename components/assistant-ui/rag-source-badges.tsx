"use client";

import { FileIcon, ExternalLinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RAGSource } from "@/lib/types/rag";

interface RAGSourceBadgesProps {
  /** Array of document sources to display */
  sources?: RAGSource[];

  /** Optional className for container styling */
  className?: string;

  /** Callback when a source is clicked - receives document ID and page number */
  onSourceClick?: (docId: string, pageNumber: number) => void;
}

/**
 * RAGSourceBadges Component
 *
 * Displays document sources retrieved via RAG search.
 * Shows filename and page number for each source.
 *
 * Features:
 * - Compact badge layout
 * - Responsive: wraps on mobile
 * - Clickable for document preview
 */
export const RAGSourceBadges = ({
  sources,
  className,
  onSourceClick,
}: RAGSourceBadgesProps) => {
  if (!sources || sources.length === 0) {
    console.log("[RAGSourceBadges] No sources provided");
    return null;
  }

  console.log("[RAGSourceBadges] Raw sources:", sources);

  // Normalize all sources (don't deduplicate - show all chunks)
  const normalizedSources = sources
    .filter((s) => {
      const isValid = s && (s.document_id || s.document_name);
      if (!isValid) console.log("[RAGSourceBadges] Filtering out invalid source:", s);
      return isValid;
    })
    .map((s) => ({
      ...s,
      document_id: s.document_id || s.id || "",
      document_name: s.document_name || s.filename || "Document",
      page_number: Number(s.page_number ?? s.page ?? 1),
    }));

  console.log("[RAGSourceBadges] Total normalized sources (all chunks):", normalizedSources.length);

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/50",
        className
      )}
    >
      {normalizedSources.map((source, idx) => (
        <button
          key={`${source.document_id}-${source.page_number}`}
          onClick={() => onSourceClick?.(source.document_id, source.page_number || 1)}
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
            Page {source.page_number}
          </span>

          {/* External link icon on hover */}
          <ExternalLinkIcon className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-70 transition-opacity" />
        </button>
      ))}

      {/* Info text */}
      <div className="w-full text-xs text-muted-foreground mt-1">
        {normalizedSources.length} chunk{normalizedSources.length !== 1 ? "s" : ""} retrieved from RAG search
      </div>
    </div>
  );
};
