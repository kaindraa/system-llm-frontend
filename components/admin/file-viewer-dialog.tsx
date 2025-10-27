"use client";

import type { FC } from "react";
import { useState, useEffect } from "react";
import { Download, X, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { FileDocument } from "@/lib/services/file";
import { fileService } from "@/lib/services/file";

interface FileViewerDialogProps {
  isOpen: boolean;
  file: FileDocument | null;
  onClose: () => void;
  onDownload: () => void;
}

export const FileViewerDialog: FC<FileViewerDialogProps> = ({
  isOpen,
  file,
  onClose,
  onDownload,
}) => {
  const [fileUrl, setFileUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen && file) {
      setIsLoading(true);
      setError("");

      // Fetch file as blob and create object URL
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
          setIsLoading(false);
        });
    } else {
      // Cleanup blob URL on close
      if (fileUrl.startsWith("blob:")) {
        URL.revokeObjectURL(fileUrl);
      }
      setFileUrl("");
      setError("");
    }

    return () => {
      // Cleanup blob URL on unmount
      if (fileUrl.startsWith("blob:")) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [isOpen, file]);

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-full max-w-4xl p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="truncate text-lg">
                {file.original_filename}
              </DialogTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {(file.file_size / 1024 / 1024).toFixed(2)} MB •{" "}
                {new Date(file.uploaded_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="ml-2 h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* PDF Viewer Container */}
        <div className="flex-1 overflow-hidden bg-muted p-4">
          {error ? (
            <div className="flex h-96 flex-col items-center justify-center rounded-lg bg-red-50 text-red-600">
              <AlertCircle className="mb-2 h-8 w-8" />
              <p className="font-medium">{error}</p>
              <p className="text-sm">Please try downloading the file instead</p>
            </div>
          ) : fileUrl ? (
            <iframe
              src={fileUrl}
              className="h-[calc(90vh-180px)] w-full border-0 rounded-lg"
              title={file.original_filename}
            />
          ) : (
            <div className="flex h-96 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <p>Loading PDF...</p>
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <DialogFooter className="border-t px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Close
          </Button>
          <Button
            onClick={onDownload}
            className="gap-2"
            disabled={isLoading || error !== ""}
          >
            <Download className="h-4 w-4" />
            {isLoading ? "Loading..." : "Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
