"use client";

import type { FC } from "react";
import { useState, useEffect } from "react";
import { Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { documentService, type DocumentResponse } from "@/lib/services/document";

interface DocumentViewerProps {
  document: DocumentResponse | null;
  isLoading?: boolean;
  pageNumber?: number;
  onSourceSelect?: (docId: string, pageNumber: number) => void;
}

export const DocumentViewer: FC<DocumentViewerProps> = ({
  document,
  isLoading = false,
  pageNumber = 1,
  onSourceSelect,
}) => {
  const [fileUrl, setFileUrl] = useState<string>("");
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleRetry = () => {
    if (document) {
      setError("");
      setFileUrl("");
      setIsPdfLoading(true);

      documentService
        .downloadDocument(document.id)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setFileUrl(url);
          console.log("[DocumentViewer] Document loaded successfully via Blob URL");
        })
        .catch((err) => {
          console.error("[DocumentViewer] Error loading document on retry:", err);
          let errorMessage = "Failed to load document";

          if (err?.response?.status) {
            const status = err.response.status;
            if (status === 404) {
              errorMessage = "Document not found (404)";
            } else if (status === 401 || status === 403) {
              errorMessage = "Access denied - Not authorized to view this document";
            } else if (status === 500) {
              errorMessage = "Server error - Unable to download file (500)";
            } else if (status >= 500) {
              errorMessage = `Server error (${status}) - Please try again later`;
            } else {
              errorMessage = `Error loading document (${status})`;
            }
          } else if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network')) {
            errorMessage = "Network error - Check your connection";
          } else if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
            errorMessage = "Request timeout - File is taking too long to load";
          } else if (err?.message?.includes('blob') || err?.message?.includes('Blob')) {
            errorMessage = "Failed to process document file";
          } else if (err?.message) {
            errorMessage = `Failed to load document: ${err.message}`;
          }

          setError(errorMessage);
        })
        .finally(() => {
          setIsPdfLoading(false);
        });
    }
  };

  useEffect(() => {
    if (document) {
      setIsPdfLoading(true);
      setError("");

      console.log("[DocumentViewer] Loading document:", {
        id: document.id,
        filename: document.original_filename,
        mimeType: document.mime_type,
        pageNumber,
      });

      // Fetch file as blob and create object URL
      documentService
        .downloadDocument(document.id)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setFileUrl(url);
          console.log("[DocumentViewer] Document loaded successfully via Blob URL", {
            blobSize: blob.size,
            blobType: blob.type,
            url: url,
          });
        })
        .catch((err) => {
          console.error("[DocumentViewer] Error loading document:", err);
          console.error("[DocumentViewer] Error details:", {
            message: err?.message,
            code: err?.code,
            status: err?.response?.status,
          });

          // Extract detailed error information
          let errorMessage = "Failed to load document";

          // Handle Axios/HTTP errors
          if (err?.response?.status) {
            const status = err.response.status;
            console.error(`[DocumentViewer] HTTP Error ${status}`);

            if (status === 404) {
              errorMessage = "Document not found (404)";
            } else if (status === 401 || status === 403) {
              errorMessage = "Access denied - Not authorized to view this document";
            } else if (status === 500) {
              errorMessage = "Server error - Unable to download file (500)";
            } else if (status >= 500) {
              errorMessage = `Server error (${status}) - Please try again later`;
            } else {
              errorMessage = `Error loading document (${status})`;
            }
          }
          // Handle network errors
          else if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network')) {
            errorMessage = "Network error - Check your connection";
            console.error("[DocumentViewer] Network connectivity issue");
          }
          // Handle timeout errors
          else if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
            errorMessage = "Request timeout - File is taking too long to load";
            console.error("[DocumentViewer] Request timeout");
          }
          // Handle blob creation errors
          else if (err?.message?.includes('blob') || err?.message?.includes('Blob')) {
            errorMessage = "Failed to process document file";
            console.error("[DocumentViewer] Blob processing error");
          }
          // Generic error with message if available
          else if (err?.message) {
            errorMessage = `Failed to load document: ${err.message}`;
          }

          setError(errorMessage);
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
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4">
          <AlertCircle className="h-10 w-10" />
          <div className="text-center">
            <p className="font-medium text-base">{error}</p>
            <p className="text-sm mt-1 text-red-500/80 dark:text-red-400/80">
              Unable to load the PDF document. Please check your connection or contact support if the problem persists.
            </p>
          </div>
          <Button
            onClick={handleRetry}
            disabled={isPdfLoading}
            variant="outline"
            className="mt-2"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {isPdfLoading ? "Loading..." : "Retry"}
          </Button>
        </div>
      ) : isPdfLoading ? (
        <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
          <p>Loading document...</p>
        </div>
      ) : fileUrl ? (
        <iframe
          src={`${fileUrl}#page=${pageNumber}`}
          className="h-full w-full border-0 flex-1"
          title={document.original_filename}
          key={`${document.id}-${pageNumber}`}
        />
      ) : null}
    </div>
  );
};
