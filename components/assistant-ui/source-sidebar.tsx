"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SourcePreview, type Citation } from "@/components/assistant-ui/source-preview";

interface SourceSidebarProps {
  citations: Citation[];
  isOpen: boolean;
  onClose: () => void;
  selectedId?: string;
  onSelectSource?: (id: string) => void;
}

export const SourceSidebar = ({
  citations,
  isOpen,
  onClose,
  selectedId,
  onSelectSource,
}: SourceSidebarProps) => {
  const [localSelectedId, setLocalSelectedId] = useState<string>(
    selectedId || citations[0]?.id || ""
  );

  const handleSelectSource = (id: string) => {
    setLocalSelectedId(id);
    onSelectSource?.(id);
  };

  const activeSource = citations.find((c) => c.id === localSelectedId);

  if (!activeSource) return null;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 right-0 w-full sm:w-96 bg-background border-l border-border z-40",
          "flex flex-col transition-transform duration-300 ease-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-lg">📚 Sources</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Source List */}
          <div className="px-4 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Available Sources
            </h3>
            <div className="space-y-2">
              {citations.map((citation) => (
                <button
                  key={citation.id}
                  onClick={() => handleSelectSource(citation.id)}
                  className={cn(
                    "w-full text-left px-3 py-3 rounded-lg transition-all duration-200",
                    "border border-transparent hover:border-border",
                    localSelectedId === citation.id
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5",
                        localSelectedId === citation.id
                          ? "bg-primary-foreground text-primary"
                          : "bg-background text-foreground"
                      )}
                    >
                      {citation.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {citation.title}
                      </div>
                      <div
                        className={cn(
                          "text-xs truncate",
                          localSelectedId === citation.id
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        )}
                      >
                        {citation.source}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Source Preview */}
          <div className="flex-1 px-4 py-4 overflow-hidden">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Preview
            </h3>
            <SourcePreview citation={activeSource} />
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-4 py-3 border-t border-border bg-muted/50 text-xs text-muted-foreground">
          📖 Total sources: {citations.length}
        </div>
      </div>
    </>
  );
};
