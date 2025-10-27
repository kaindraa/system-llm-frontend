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
          const url = URL.createObjectURL(blob);
          setFileUrl(url);
        })
        .catch((err) => {
          console.error("Error loading PDF:", err);
          setError("Failed to load PDF file");
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
