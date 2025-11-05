"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, DownloadIcon, ExternalLinkIcon } from "lucide-react";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";

export interface Citation {
  id: string;
  title: string;
  source: string;
  chapter?: string;
  excerpt: string;
  source_type: "pdf" | "text" | "markdown" | "url";
  download_url?: string;
  open_url?: string;
}

interface SourcePreviewProps {
  citation: Citation;
}

export const SourcePreview = ({ citation }: SourcePreviewProps) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  const onCopyExcerpt = () => {
    copyToClipboard(citation.excerpt);
  };

  return (
    <div className="flex flex-col h-full bg-muted/50 rounded-lg border border-border p-4">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-border">
        <h3 className="font-semibold text-base mb-1">{citation.title}</h3>
        <p className="text-sm text-muted-foreground">{citation.source}</p>
        {citation.chapter && (
          <p className="text-xs text-muted-foreground mt-1">📖 {citation.chapter}</p>
        )}
      </div>

      {/* Excerpt */}
      <div className="flex-1 overflow-y-auto mb-4">
        <div className="text-sm leading-relaxed text-foreground">
          <p className="italic text-muted-foreground mb-2">"</p>
          <p className="whitespace-pre-wrap">{citation.excerpt}</p>
          <p className="italic text-muted-foreground mt-2">"</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-border">
        {/* Copy excerpt */}
        <TooltipIconButton
          tooltip={isCopied ? "Copied!" : "Copy excerpt"}
          onClick={onCopyExcerpt}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          {!isCopied && <CopyIcon className="h-4 w-4" />}
          {isCopied && <CheckIcon className="h-4 w-4" />}
          <span className="ml-2 text-xs">{isCopied ? "Copied" : "Copy"}</span>
        </TooltipIconButton>

        {/* Download */}
        {citation.download_url && (
          <a
            href={citation.download_url}
            download
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-muted text-xs font-medium transition-colors"
            title="Download source document"
          >
            <DownloadIcon className="h-4 w-4" />
            <span>Download</span>
          </a>
        )}

        {/* Open in new tab */}
        {citation.open_url && (
          <a
            href={citation.open_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-2 rounded-md border border-border hover:bg-muted transition-colors"
            title="Open in new tab"
          >
            <ExternalLinkIcon className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
};

const useCopyToClipboard = ({
  copiedDuration = 3000,
}: {
  copiedDuration?: number;
} = {}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyToClipboard = (value: string) => {
    if (!value) return;

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), copiedDuration);
    });
  };

  return { isCopied, copyToClipboard };
};
