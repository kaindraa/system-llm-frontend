import apiClient from "@/lib/api/client";

export interface FileDocument {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  status: "uploaded" | "processing" | "processed" | "failed";
  uploaded_at: string;
  processed_at?: string;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  status: string;
  uploaded_at: string;
}

export interface FileListResponse {
  files: FileDocument[];
  total: number;
  page: number;
  page_size: number;
}

export const fileService = {
  async listFiles(
    skip: number = 0,
    limit: number = 10,
    status?: string
  ): Promise<FileListResponse> {
    const params = new URLSearchParams();
    params.append("skip", skip.toString());
    params.append("limit", limit.toString());
    if (status) {
      params.append("status", status);
    }

    const response = await apiClient.get<FileListResponse>(
      `/files?${params.toString()}`
    );
    return response.data;
  },

  async getFile(id: string): Promise<FileDocument> {
    const response = await apiClient.get<FileDocument>(`/files/${id}`);
    return response.data;
  },

  async uploadFile(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<FileUploadResponse>(
      "/files/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  async downloadFile(id: string): Promise<Blob> {
    const response = await apiClient.get(`/files/${id}/download`, {
      responseType: "blob",
    });
    return response.data;
  },

  async deleteFile(id: string): Promise<void> {
    await apiClient.delete(`/files/${id}`);
  },

  async updateFileStatus(
    id: string,
    status: "uploaded" | "processing" | "processed" | "failed"
  ): Promise<FileDocument> {
    const response = await apiClient.patch<FileDocument>(`/files/${id}/status`, {
      status,
    });
    return response.data;
  },
};
