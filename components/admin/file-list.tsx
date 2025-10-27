"use client";

import type { FC } from "react";
import {
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { FileDocument } from "@/lib/services/file";

interface FileListProps {
  files: FileDocument[];
  total: number;
  currentPage: number;
  pageSize: number;
  isLoading?: boolean;
  onView: (file: FileDocument) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string, filename: string) => void;
  onCreateNew: () => void;
  onPageChange: (page: number) => void;
}

export const FileList: FC<FileListProps> = ({
  files,
  total,
  currentPage,
  pageSize,
  isLoading = false,
  onView,
  onDelete,
  onDownload,
  onCreateNew,
  onPageChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, total);

  if (isLoading && files.length === 0) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!isLoading && files.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/25 p-12">
        <div className="text-center">
          <FileUp className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">No files uploaded yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Upload your first PDF file for learning materials
          </p>
          <Button onClick={onCreateNew}>Upload File</Button>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return (
          <Clock className="h-4 w-4 text-blue-600" />
        );
      case "processed":
        return (
          <CheckCircle className="h-4 w-4 text-green-600" />
        );
      case "failed":
        return (
          <AlertCircle className="h-4 w-4 text-red-600" />
        );
      default:
        return (
          <FileUp className="h-4 w-4 text-gray-600" />
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            <Clock className="h-3 w-3" />
            Processing
          </span>
        );
      case "processed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            <CheckCircle className="h-3 w-3" />
            Processed
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            <AlertCircle className="h-3 w-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            <FileUp className="h-3 w-3" />
            Uploaded
          </span>
        );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Filename
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Size
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Uploaded
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id} className="border-b hover:bg-muted/50">
                {/* Filename */}
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium truncate">
                      {file.original_filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {file.id.substring(0, 8)}...
                    </p>
                  </div>
                </td>

                {/* File Size */}
                <td className="px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.file_size)}
                  </p>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  {getStatusBadge(file.status)}
                </td>

                {/* Uploaded Date */}
                <td className="px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    {formatDate(file.uploaded_at)}
                  </p>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(file)}
                      title="View file"
                      disabled={isLoading}
                    >
                      <FileUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onDownload(file.id, file.original_filename)
                      }
                      title="Download file"
                      disabled={isLoading}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to delete "${file.original_filename}"?`
                          )
                        ) {
                          onDelete(file.id);
                        }
                      }}
                      title="Delete file"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startIndex} to {endIndex} of {total} results
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1;
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  disabled={isLoading}
                >
                  {page}
                </Button>
              );
            } else if (
              (page === currentPage - 2 || page === currentPage + 2) &&
              totalPages > 5
            ) {
              return (
                <span key={page} className="px-2 py-1">
                  ...
                </span>
              );
            }
            return null;
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
