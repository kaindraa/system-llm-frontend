"use client";

import { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, Download, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { documentService, type DocumentResponse } from "@/lib/services/document";
import { Button } from "@/components/ui/button";
import { DocumentViewer } from "@/components/assistant-ui/document-viewer";

interface DocumentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSourceSelect?: (docId: string, pageNumber: number) => void;
  selectedSourceDoc?: { docId: string; pageNumber: number } | null;
  onSourceSelected?: () => void;
}

export const DocumentSidebar = ({
  isOpen,
  onClose,
  onSourceSelect,
  selectedSourceDoc,
  onSourceSelected,
}: DocumentSidebarProps) => {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isViewerLoading, setIsViewerLoading] = useState(false);

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

  // Handle selected source from message bubble
  useEffect(() => {
    if (selectedSourceDoc) {
      console.log("[DocumentSidebar] Selected source received:", selectedSourceDoc);
      setSelectedId(selectedSourceDoc.docId);
      setSelectedPage(selectedSourceDoc.pageNumber);
      setIsViewerLoading(true);
      setTimeout(() => setIsViewerLoading(false), 500);
      onSourceSelected?.();
    }
  }, [selectedSourceDoc, onSourceSelected]);

  const selectedDoc = documents && documents.length > 0
    ? documents.find((d) => d.id === selectedId)
    : undefined;

  const handleDocumentSelect = (docId: string) => {
    setSelectedId(docId);
    setSelectedPage(1); // Reset to page 1 when selecting new document
    setShowDropdown(false);
    setIsViewerLoading(true);
    // Simulate loading time for viewer to properly render
    setTimeout(() => setIsViewerLoading(false), 500);
  };

  const handleSourceSelect = (docId: string, pageNumber: number) => {
    console.log("[DocumentSidebar] Source clicked:", { docId, pageNumber });
    setSelectedId(docId);
    setSelectedPage(pageNumber);
    setShowDropdown(false);
    setIsViewerLoading(true);
    // Call parent callback if provided
    onSourceSelect?.(docId, pageNumber);
    // Simulate loading time for viewer to properly render
    setTimeout(() => setIsViewerLoading(false), 500);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedDoc) return;

    try {
      setIsDownloading(true);
      await documentService.downloadDocumentAsFile(selectedDoc.id, selectedDoc.original_filename);
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

        {/* Content - Main section with dropdown and viewer */}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
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

          {/* Documents Dropdown + Viewer */}
          {!isLoading && documents.length > 0 && (
            <>
              {/* Dropdown Section - Fixed */}
              <div className="flex-shrink-0 p-3 border-b border-border">
                <div className="relative">
                  {/* Dropdown Button */}
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg",
                      "border transition-colors",
                      "bg-muted hover:bg-muted/80",
                      "border-border focus:outline-none focus:ring-2 focus:ring-ring"
                    )}
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <FileText className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate">
                          {selectedDoc?.original_filename || "Select a document"}
                        </p>
                        {selectedDoc && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatFileSize(selectedDoc.file_size)}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform",
                        showDropdown && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {documents.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => handleDocumentSelect(doc.id)}
                          className={cn(
                            "w-full text-left px-3 py-2.5 transition-colors border-b border-border last:border-b-0",
                            "hover:bg-muted focus:outline-none",
                            selectedId === doc.id && "bg-muted"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {doc.original_filename}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span
                                  className={cn(
                                    "inline-block w-2 h-2 rounded-full",
                                    getStatusColor(doc.status)
                                  )}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(doc.file_size)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Document Viewer - Full Size */}
              {selectedDoc && (
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  {/* Viewer Container - Full Space */}
                  <div className="flex-1 overflow-hidden bg-background">
                    <DocumentViewer
                      document={selectedDoc}
                      isLoading={isViewerLoading}
                      pageNumber={selectedPage}
                      onSourceSelect={handleSourceSelect}
                    />
                  </div>

                  {/* Download Button - Minimal */}
                  <div className="flex-shrink-0 px-3 py-2 border-t border-border">
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
