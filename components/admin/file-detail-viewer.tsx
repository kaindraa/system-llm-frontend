"use client";

import type { FC } from "react";
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import type { FileDocument } from "@/lib/services/file";
import { fileService } from "@/lib/services/file";

interface FileDetailViewerProps {
  file: FileDocument | null;
  isLoading?: boolean;
}

export const FileDetailViewer: FC<FileDetailViewerProps> = ({
  file,
  isLoading = false,
}) => {
  const [fileUrl, setFileUrl] = useState<string>("");
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (file) {
      setIsPdfLoading(true);
      setError("");

      fileService
        .downloadFile(file.id)
        .then((blob) => {
          console.log(
            `[FileDetailViewer] Blob received: size=${blob.size}, type=${blob.type}`
          );

          // Validate blob
          if (blob.size === 0) {
            throw new Error("Received empty blob - file may be corrupted");
          }

          // For non-PDF files, still create object URL
          const url = URL.createObjectURL(blob);
          console.log(`[FileDetailViewer] Created object URL: ${url}`);
          setFileUrl(url);
        })
        .catch((err: any) => {
          const errorMsg =
            err?.message ||
            err?.response?.statusText ||
            "Unknown error occurred";
          const errorDetails = {
            message: errorMsg,
            code: err?.code,
            status: err?.response?.status,
            statusText: err?.response?.statusText,
            fileId: file.id,
            fileName: file.original_filename,
          };

          console.error("[FileDetailViewer] Error loading PDF:", errorDetails);
          setError(
            `Failed to load PDF: ${errorMsg}. Please try again or contact support.`
          );
        })
        .finally(() => {
          setIsPdfLoading(false);
        });
    } else {
      if (fileUrl.startsWith("blob:")) {
        URL.revokeObjectURL(fileUrl);
      }
      setFileUrl("");
      setError("");
    }

    return () => {
      if (fileUrl.startsWith("blob:")) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [file]);

  if (!file) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Select a file to view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Minimal Header - Title Only */}
      <div className="border-b px-4 py-2 flex-shrink-0">
        <h2 className="text-sm font-semibold truncate">
          {file.original_filename}
        </h2>
      </div>

      {/* PDF Viewer - Full Space */}
      <div className="flex-1 overflow-hidden bg-muted">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center bg-red-50 text-red-600">
            <AlertCircle className="mb-2 h-8 w-8" />
            <p className="font-medium">{error}</p>
            <p className="text-sm">Failed to load PDF</p>
          </div>
        ) : isPdfLoading ? (
          <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
            <p>Loading PDF...</p>
          </div>
        ) : fileUrl ? (
          <iframe
            src={fileUrl}
            className="h-full w-full border-0"
            title={file.original_filename}
          />
        ) : null}
      </div>
    </div>
  );
};
