import axios from "axios";

export interface DocumentResponse {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  status: "uploaded" | "processing" | "processed" | "failed";
  uploaded_at: string;
  processed_at?: string;
}

export interface DocumentListResponse {
  items: DocumentResponse[];
  total: number;
  skip: number;
  limit: number;
}

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export const documentService = {
  // List user's documents
  async listDocuments(
    skip = 0,
    limit = 10,
    status?: string
  ): Promise<DocumentListResponse> {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      console.log("[DocumentService] Token from localStorage:", token ? `${token.substring(0, 20)}...` : "MISSING");

      if (!token) {
        throw new Error("No authentication token");
      }

      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
      });

      if (status) {
        params.append("status", status);
      }

      const url = `${baseUrl}/files?${params.toString()}`;
      console.log("[DocumentService] Fetching documents from:", url);
      console.log("[DocumentService] Authorization header:", `Bearer ${token.substring(0, 20)}...`);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("[DocumentService] Response status:", response.status);
      console.log("[DocumentService] Response headers:", response.headers);
      console.log("[DocumentService] Response received:", response.data);

      // Ensure response has proper structure
      const data = response.data;

      // Handle different response formats
      let items = [];
      if (Array.isArray(data)) {
        // If data is directly an array
        items = data;
      } else if (data && Array.isArray(data.files)) {
        // If data has files property (main format from /api/v1/files)
        items = data.files;
      } else if (data && Array.isArray(data.items)) {
        // If data has items property
        items = data.items;
      } else if (data && Array.isArray(data.data)) {
        // If data has data property
        items = data.data;
      }

      const result = {
        items: items,
        total: data.total || items.length,
        skip: data.skip || skip,
        limit: data.limit || limit,
      };

      console.log("[DocumentService] Parsed result:", result);
      return result;
    } catch (error) {
      console.error("[DocumentService] Error listing documents:", error);
      if (error instanceof Error) {
        console.error("[DocumentService] Error message:", error.message);
      }
      // Return empty list instead of throwing
      return {
        items: [],
        total: 0,
        skip,
        limit,
      };
    }
  },

  // Get single document details
  async getDocument(fileId: string): Promise<DocumentResponse> {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        throw new Error("No authentication token");
      }

      const response = await axios.get(`${baseUrl}/files/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("[DocumentService] Error getting document:", error);
      throw error;
    }
  },

  // Get document as Blob (for viewing)
  async downloadDocument(fileId: string): Promise<Blob> {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        throw new Error("No authentication token");
      }

      const response = await axios.get(
        `${baseUrl}/files/${fileId}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const blob = response.data;
      console.log("[DocumentService.downloadDocument] Blob received:");
      console.log("  - Size:", blob.size, "bytes");
      console.log("  - Type:", blob.type);
      console.log("  - Constructor:", blob.constructor.name);

      // Validate blob is not empty
      if (blob.size === 0) {
        throw new Error("Downloaded file is empty (0 bytes)");
      }

      // Validate PDF signature (starts with %PDF)
      const header = await blob.slice(0, 4).text();
      if (header !== "%PDF") {
        console.warn("[DocumentService.downloadDocument] File does not start with PDF signature, file might be corrupted or not a PDF");
        console.log("[DocumentService.downloadDocument] File header (first 4 bytes):", header);
      }

      return blob;
    } catch (error) {
      console.error("[DocumentService] Error downloading document:", error);
      throw error;
    }
  },

  // Download and trigger browser download
  async downloadDocumentAsFile(fileId: string, filename: string = "document"): Promise<void> {
    try {
      const blob = await this.downloadDocument(fileId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentElement?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("[DocumentService] Error downloading document as file:", error);
      throw error;
    }
  },

  // Get document content as text (if available)
  async getDocumentContent(fileId: string): Promise<string> {
    try {
      const doc = await this.getDocument(fileId);
      // Return content field if available, or filename as fallback
      return (doc as any).content || doc.original_filename;
    } catch (error) {
      console.error("[DocumentService] Error getting document content:", error);
      throw error;
    }
  },
};
