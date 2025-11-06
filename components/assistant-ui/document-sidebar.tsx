"use client";

import { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { documentService, type DocumentResponse } from "@/lib/services/document";
import { Button } from "@/components/ui/button";

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
        const response = await documentService.listDocuments(0, 100);

        console.log("[DocumentSidebar] Response:", response);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processed":
        return "bg-green-500";
      case "processing":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "processed":
        return "✅ Processed";
      case "processing":
        return "⏳ Processing";
      case "failed":
        return "❌ Failed";
      case "uploaded":
        return "📤 Uploaded";
      default:
        return status;
    }
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

      {/* Sidebar - Desktop static positioning, Mobile fixed */}
      <div
        className={cn(
          "w-full sm:w-96 bg-background border-l border-border",
          "flex flex-col h-full",
          // Desktop: static, part of flex layout
          "lg:flex-shrink-0 lg:h-auto",
          // Mobile: fixed, transforms off-screen
          "fixed lg:static right-0 top-0 bottom-0 z-40 lg:z-auto transition-transform duration-300 ease-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header - Only on Mobile */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0 lg:hidden">
          <h2 className="font-semibold text-lg">📚 Documents</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Main scrollable section (like SidebarContent) */}
        <div
          className="flex-1 overflow-auto min-h-0 flex flex-col"
          data-testid="document-sidebar-main-scroll"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255, 0, 0, 0.5) transparent" // Red scrollbar untuk visible
          }}
        >
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground flex-1">
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <p className="text-sm">Loading documents...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="m-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex gap-2 flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && documents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground px-4 flex-1">
              <FileText className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">No documents available</p>
              <p className="text-xs mt-1">Contact admin to upload files</p>
            </div>
          )}

          {/* Documents List Section */}
          {!isLoading && documents.length > 0 && (
            <>
              {/* Section: Documents List */}
              <div className="flex flex-col gap-1 p-3 flex-shrink-0">
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
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {doc.original_filename}
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
                              getStatusColor(doc.status)
                            )}
                          />
                          {formatFileSize(doc.file_size)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Divider */}
              {selectedDoc && (
                <div className="h-px bg-border flex-shrink-0" />
              )}

              {/* Section: Document Preview */}
              {selectedDoc && (
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  {/* Preview Header */}
                  <div className="px-4 py-3 border-b border-border flex-shrink-0">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Preview
                    </h3>
                  </div>

                  {/* Preview Content */}
                  <div
                    className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
                    data-testid="document-sidebar-preview-scroll"
                    style={{
                      scrollbarGutter: "stable",
                      scrollbarWidth: "thin",
                      scrollbarColor: "rgba(0, 255, 0, 0.5) transparent" // Green scrollbar untuk visible
                    }}
                  >
                    {/* File Name */}
                    <div>
                      <p className="text-sm font-semibold break-words">
                        {selectedDoc.original_filename}
                      </p>
                    </div>

                    {/* File Info */}
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Size:</span>
                        <span>{formatFileSize(selectedDoc.file_size)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Uploaded:</span>
                        <span>{formatDate(selectedDoc.uploaded_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                            selectedDoc.status === "processed"
                              ? "bg-green-500/20 text-green-700 dark:text-green-400"
                              : selectedDoc.status === "processing"
                                ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                                : selectedDoc.status === "failed"
                                  ? "bg-red-500/20 text-red-700 dark:text-red-400"
                                  : "bg-gray-500/20 text-gray-700 dark:text-gray-400"
                          )}
                        >
                          {getStatusLabel(selectedDoc.status)}
                        </span>
                      </div>
                      {selectedDoc.processed_at && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Processed:</span>
                          <span>{formatDate(selectedDoc.processed_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-border my-1" />

                    {/* Type */}
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Type:</span> {selectedDoc.mime_type}
                    </div>
                  </div>

                  {/* Download Button */}
                  <div className="px-4 py-3 border-t border-border flex-shrink-0">
                    <Button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="w-full"
                      size="sm"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="px-4 py-3 border-t border-border bg-muted/50 text-xs text-muted-foreground flex-shrink-0">
          📖 {documents.length} document{documents.length !== 1 ? "s" : ""}
        </div>
      </div>
    </>
  );
};
