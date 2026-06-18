"use client";

import { useState, useEffect } from "react";
import {
  fileService,
  type FileDocument,
} from "@/lib/services/file";
import { FileUploadDialog } from "@/components/admin/file-upload-dialog";
import { FileSidebar } from "@/components/admin/file-sidebar";
import { FileDetailViewer } from "@/components/admin/file-detail-viewer";

const PAGE_SIZE = 10;

export default function FilePage() {
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploadLoading, setIsUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileDocument | null>(null);
  const [isActionBusy, setIsActionBusy] = useState(false);

  // Load files. `silent` skips the loading spinner (used by background polling).
  const loadFiles = async (page: number = 1, silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const response = await fileService.listFiles(skip, PAGE_SIZE);
      setFiles(response.files);
      setTotal(response.total);
      setCurrentPage(page);
      // Keep the selected file's detail panel in sync with fresh status.
      setSelectedFile((prev) =>
        prev ? response.files.find((f) => f.id === prev.id) ?? prev : prev
      );
    } catch (error) {
      console.error("Error loading files:", error);
      if (!silent) alert("Failed to load files");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadFiles(1);
  }, []);

  // Poll while any document is still processing, so stage/status stays live.
  useEffect(() => {
    const hasProcessing = files.some((f) => f.status === "processing");
    if (!hasProcessing) return;
    const interval = setInterval(() => loadFiles(currentPage, true), 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, currentPage]);

  // Handle upload
  const handleFileUpload = async (file: File) => {
    setIsUploadLoading(true);
    try {
      await fileService.uploadFile(file);
      alert("File uploaded successfully");
      setIsUploadDialogOpen(false);
      // Reload files from first page
      await loadFiles(1);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    } finally {
      setIsUploadLoading(false);
    }
  };

  // Handle select file from sidebar
  const handleSelectFile = (file: FileDocument) => {
    setSelectedFile(file);
  };

  // Handle delete
  const handleDelete = async (fileToDelete?: FileDocument) => {
    const file = fileToDelete || selectedFile;
    if (!file) return;

    if (!window.confirm(`Delete "${file.original_filename}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await fileService.deleteFile(file.id);
      alert("File deleted successfully");
      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
      }
      await loadFiles(1);
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle (re)process
  const handleReprocess = async (file: FileDocument) => {
    setIsActionBusy(true);
    try {
      await fileService.ingestFile(file.id);
      await loadFiles(currentPage, true);
    } catch (error) {
      console.error("Error queuing ingestion:", error);
      alert("Failed to start processing");
    } finally {
      setIsActionBusy(false);
    }
  };

  // Handle cancel of an in-progress ingestion
  const handleCancel = async (file: FileDocument) => {
    setIsActionBusy(true);
    try {
      await fileService.cancelIngestion(file.id);
      await loadFiles(currentPage, true);
    } catch (error) {
      console.error("Error cancelling ingestion:", error);
      alert("Failed to request cancellation");
    } finally {
      setIsActionBusy(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    loadFiles(page);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-8 px-6 py-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Files</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Manage PDF files uploaded by users for learning materials
          </p>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="grid grid-cols-3 gap-6 rounded-lg border bg-card overflow-hidden h-[600px]">
        {/* Left Panel - File Sidebar */}
        <div className="col-span-1">
          <FileSidebar
            files={files}
            selectedFileId={selectedFile?.id || null}
            isLoading={isLoading}
            onSelectFile={handleSelectFile}
            onCreateNew={() => setIsUploadDialogOpen(true)}
            onDeleteFile={handleDelete}
            onPageChange={handlePageChange}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </div>

        {/* Right Panel - File Viewer */}
        <div className="col-span-2 flex flex-col">
          <FileDetailViewer
            file={selectedFile}
            isLoading={isLoading}
            isActionBusy={isActionBusy}
            onReprocess={handleReprocess}
            onCancel={handleCancel}
          />
        </div>
      </div>

      {/* Upload Dialog */}
      <FileUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onSubmit={handleFileUpload}
        isLoading={isUploadLoading}
      />
    </div>
  );
}
