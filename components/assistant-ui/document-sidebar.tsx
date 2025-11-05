"use client";

import { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { documentService, type DocumentResponse } from "@/lib/services/document";

interface DocumentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentSidebar = ({
  isOpen,
  onClose,
}: DocumentSidebarProps) => {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch documents on mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        console.log("[DocumentSidebar] Mounting, fetching documents...");
        setIsLoading(true);
        setError(null);
        // Fetch all documents regardless of status (like admin page does)
        // API limit max 100 per request
        const response = await documentService.listDocuments(0, 100);

        console.log("[DocumentSidebar] Response:", response);

        // Safely handle response
        const docs = response?.items || [];
        console.log("[DocumentSidebar] Parsed documents:", docs);

        setDocuments(docs);

        if (docs && docs.length > 0) {
          console.log("[DocumentSidebar] Setting first doc as selected:", docs[0].id);
          setSelectedId(docs[0].id);
        } else {
          console.log("[DocumentSidebar] No documents in response");
        }
      } catch (err) {
        console.error("[DocumentSidebar] Error loading documents:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load documents"
        );
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  const selectedDoc = documents && documents.length > 0
    ? documents.find((d) => d.id === selectedId)
    : undefined;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedDoc) return;

    try {
      setIsDownloading(true);
      await documentService.downloadDocument(selectedDoc.id);
    } catch (err) {
      console.error("[DocumentSidebar] Download failed:", err);
      setError("Failed to download document");
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
          <h2 className="font-semibold text-lg">📚 Documents</h2>
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
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <p className="text-sm">Loading documents...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="mx-4 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex gap-2">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && documents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground px-4">
              <p className="text-sm">📭 No documents uploaded yet</p>
              <p className="text-xs mt-2">Upload documents via admin panel at:</p>
              <p className="text-xs font-mono bg-muted px-2 py-1 rounded mt-2 w-full text-center overflow-x-auto">
                /admin
              </p>
              <p className="text-xs mt-3 text-center">
                Check browser console (F12) for API response details
              </p>
            </div>
          )}

          {/* Document List */}
          {!isLoading && documents.length > 0 && (
            <div className="px-4 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Available Documents ({documents.length})
              </h3>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedId(doc.id)}
                    className={cn(
                      "w-full text-left px-3 py-3 rounded-lg transition-all duration-200",
                      "border border-transparent hover:border-border",
                      selectedId === doc.id
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    <div className="text-sm font-medium truncate">
                      {doc.original_filename}
                    </div>
                    <div
                      className={cn(
                        "text-xs truncate mt-1",
                        selectedId === doc.id
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatFileSize(doc.file_size)}
                    </div>
                    <div
                      className={cn(
                        "text-xs mt-1 flex items-center gap-1",
                        selectedId === doc.id
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground/70"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block w-2 h-2 rounded-full",
                          doc.status === "processed"
                            ? "bg-green-500"
                            : doc.status === "processing"
                              ? "bg-yellow-500"
                              : doc.status === "failed"
                                ? "bg-red-500"
                                : "bg-gray-500"
                        )}
                      />
                      {doc.status}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Document Preview */}
          {!isLoading && selectedDoc && (
            <div className="flex-1 px-4 py-4 overflow-hidden">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Preview
              </h3>
              <div className="flex flex-col h-full bg-muted/50 rounded-lg border border-border p-4 overflow-hidden">
                {/* Preview Header */}
                <div className="mb-3 pb-3 border-b border-border">
                  <h4 className="font-semibold text-sm break-words">
                    {selectedDoc.original_filename}
                  </h4>
                  <div className="text-xs text-muted-foreground mt-2 space-y-1">
                    <p>📦 Size: {formatFileSize(selectedDoc.file_size)}</p>
                    <p>📅 Uploaded: {formatDate(selectedDoc.uploaded_at)}</p>
                    <p
                      className={cn(
                        "inline-flex items-center gap-1",
                        selectedDoc.status === "processed"
                          ? "text-green-600 dark:text-green-400"
                          : selectedDoc.status === "processing"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : selectedDoc.status === "failed"
                              ? "text-red-600 dark:text-red-400"
                              : "text-gray-600"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block w-2 h-2 rounded-full",
                          selectedDoc.status === "processed"
                            ? "bg-green-500"
                            : selectedDoc.status === "processing"
                              ? "bg-yellow-500"
                              : selectedDoc.status === "failed"
                                ? "bg-red-500"
                                : "bg-gray-500"
                        )}
                      />
                      Status: {selectedDoc.status}
                    </p>
                  </div>
                </div>

                {/* Download button */}
                <div className="mb-3">
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download
                      </>
                    )}
                  </button>
                </div>

                {/* Document Info */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>📄 Type: {selectedDoc.mime_type}</p>
                  {selectedDoc.processed_at && (
                    <p>
                      ✅ Processed: {formatDate(selectedDoc.processed_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-muted/50 text-xs text-muted-foreground">
          📖 Total: {documents.length} document{documents.length !== 1 ? "s" : ""}
        </div>
      </div>
    </>
  );
};
