"use client";

import type { FC } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { FileDocument } from "@/lib/services/file";

interface FileSidebarProps {
  files: FileDocument[];
  selectedFileId: string | null;
  isLoading?: boolean;
  onSelectFile: (file: FileDocument) => void;
  onCreateNew: () => void;
  onDeleteFile?: (file: FileDocument) => void;
  onPageChange: (page: number) => void;
  currentPage: number;
  totalPages: number;
}

export const FileSidebar: FC<FileSidebarProps> = ({
  files,
  selectedFileId,
  isLoading = false,
  onSelectFile,
  onCreateNew,
  onDeleteFile,
  onPageChange,
  currentPage,
  totalPages,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing":
        return "text-blue-600";
      case "processed":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="flex flex-col h-full border-r">
      {/* Search/Filter Header */}
      <div className="p-4 border-b flex-shrink-0">
        <Button
          onClick={onCreateNew}
          size="sm"
          className="w-full gap-2"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4" />
          Upload File
        </Button>
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && files.length === 0 ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No files uploaded yet
          </div>
        ) : (
          <div className="divide-y">
            {files.map((file) => (
              <div
                key={file.id}
                className={`flex items-start gap-2 p-3 hover:bg-muted transition-colors group ${
                  selectedFileId === file.id ? "bg-muted" : ""
                }`}
              >
                {/* File Info - Clickable */}
                <button
                  onClick={() => onSelectFile(file)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="truncate font-medium text-sm mb-1">
                    {file.original_filename}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>{(file.file_size / 1024 / 1024).toFixed(2)} MB</div>
                    <div
                      className={`inline-block capitalize font-medium ${getStatusColor(
                        file.status
                      )}`}
                    >
                      {file.status}
                    </div>
                  </div>
                </button>

                {/* Delete Button - Right side */}
                {onDeleteFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file);
                    }}
                    disabled={isLoading}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete file"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t flex-shrink-0 flex gap-2 justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            Prev
          </Button>
          <span className="text-xs text-muted-foreground self-center">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
