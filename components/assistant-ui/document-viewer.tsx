"use client";

import type { FC } from "react";
import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { documentService, type DocumentResponse } from "@/lib/services/document";

interface DocumentViewerProps {
  document: DocumentResponse | null;
  isLoading?: boolean;
}

export const DocumentViewer: FC<DocumentViewerProps> = ({
  document,
  isLoading = false,
}) => {
  const [fileUrl, setFileUrl] = useState<string>("");
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (document) {
      setIsPdfLoading(true);
      setError("");

      console.log("[DocumentViewer] Loading document:", {
        id: document.id,
        filename: document.original_filename,
        mimeType: document.mime_type,
      });

      // Fetch file as blob and create object URL
      documentService
        .downloadDocument(document.id)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setFileUrl(url);
          console.log("[DocumentViewer] Document loaded successfully via Blob URL");
        })
        .catch((err) => {
          console.error("[DocumentViewer] Error loading document:", err);
          setError("Failed to load document");
        })
        .finally(() => {
          setIsPdfLoading(false);
        });
    } else {
      // Cleanup blob URL when document is cleared
      if (fileUrl.startsWith("blob:")) {
        URL.revokeObjectURL(fileUrl);
      }
      setFileUrl("");
      setError("");
    }

    // Cleanup on unmount
    return () => {
      if (fileUrl.startsWith("blob:")) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [document]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p className="text-sm">Loading document...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Select a document to view</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Error State */}
      {error ? (
        <div className="flex h-full flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          <AlertCircle className="mb-2 h-8 w-8" />
          <p className="font-medium">{error}</p>
          <p className="text-sm">Failed to load document</p>
        </div>
      ) : isPdfLoading ? (
        <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
          <p>Loading document...</p>
        </div>
      ) : fileUrl ? (
        <iframe
          src={fileUrl}
          className="h-full w-full border-0 flex-1"
          title={document.original_filename}
        />
      ) : null}
    </div>
  );
};
