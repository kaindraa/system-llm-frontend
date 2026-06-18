"use client";

import type { FC } from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  RotateCcw,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  FileDocument,
  FileStatus,
  IngestionStage,
} from "@/lib/services/file";

interface FileProcessingPanelProps {
  file: FileDocument;
  isBusy?: boolean;
  onReprocess: (file: FileDocument) => void;
  onCancel: (file: FileDocument) => void;
}

// Ordered stages shown as a checklist (queued/done are implicit endpoints).
const STAGES: { key: IngestionStage; label: string }[] = [
  { key: "parsing", label: "Parsing" },
  { key: "chunking", label: "Chunking" },
  { key: "embedding", label: "Embedding" },
  { key: "inserting", label: "Indexing" },
];

const STATUS_STYLES: Record<FileStatus, { label: string; className: string }> = {
  uploaded: { label: "Uploaded", className: "bg-gray-100 text-gray-700" },
  processing: { label: "Processing", className: "bg-blue-100 text-blue-700" },
  processed: { label: "Processed", className: "bg-green-100 text-green-700" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelled", className: "bg-amber-100 text-amber-700" },
};

export const FileProcessingPanel: FC<FileProcessingPanelProps> = ({
  file,
  isBusy = false,
  onReprocess,
  onCancel,
}) => {
  const status = file.status;
  const isProcessing = status === "processing";
  const isProcessed = status === "processed";
  const badge = STATUS_STYLES[status] ?? STATUS_STYLES.uploaded;

  // Resolve which stage index is "active" during processing.
  const activeIndex = STAGES.findIndex((s) => s.key === file.current_stage);

  const stageState = (index: number): "done" | "active" | "todo" => {
    if (isProcessed) return "done";
    if (!isProcessing) return "todo";
    if (file.current_stage === "queued") return "todo";
    if (activeIndex === -1) return "todo";
    if (index < activeIndex) return "done";
    if (index === activeIndex) return "active";
    return "todo";
  };

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      {/* Status + actions row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
          {isProcessing && file.current_stage === "queued" && (
            <span className="text-xs text-muted-foreground">queued…</span>
          )}
          {typeof file.retry_count === "number" && file.retry_count > 0 && (
            <span className="text-xs text-muted-foreground">
              retried {file.retry_count}×
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isProcessing ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={isBusy || file.cancel_requested}
              onClick={() => onCancel(file)}
            >
              <Ban className="h-3.5 w-3.5" />
              {file.cancel_requested ? "Cancelling…" : "Cancel"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={isBusy}
              onClick={() => onReprocess(file)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {isProcessed ? "Re-process" : "Process"}
            </Button>
          )}
        </div>
      </div>

      {/* Stage checklist (only meaningful while processing or once processed) */}
      {(isProcessing || isProcessed) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {STAGES.map((stage, i) => {
            const state = stageState(i);
            return (
              <div
                key={stage.key}
                className="flex items-center gap-1.5 text-xs"
              >
                {state === "done" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : state === "active" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300" />
                )}
                <span
                  className={
                    state === "done"
                      ? "text-green-700"
                      : state === "active"
                        ? "font-medium text-blue-700"
                        : "text-muted-foreground"
                  }
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Error detail */}
      {status === "failed" && file.last_error && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="break-words">{file.last_error}</span>
        </div>
      )}
    </div>
  );
};
