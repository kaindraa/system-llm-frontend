"use client";

import type { FC } from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUploadInput } from "./file-upload-input";

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File) => void;
  isLoading?: boolean;
}

export const FileUploadDialog: FC<FileUploadDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onSubmit(selectedFile);
      // Don't clear selectedFile here - let parent handle dialog close
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedFile(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload PDF File</DialogTitle>
          <DialogDescription>
            Select a PDF file from your computer to upload. Maximum file size is
            50 MB.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <FileUploadInput
            onFileSelect={handleFileSelect}
            isLoading={isLoading}
            disabled={isLoading}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
