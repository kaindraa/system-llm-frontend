/**
 * RAG Configuration Service
 * Manages system-wide RAG settings and chat configuration
 */

export interface ChatConfig {
  id: number;
  prompt_general: string;
  default_top_k: number;
  max_top_k: number;
  similarity_threshold: number;
  tool_calling_max_iterations: number;
  tool_calling_enabled: boolean;
  include_rag_instruction: boolean;
  updated_at: string;
}

export interface ChatConfigUpdateRequest {
  prompt_general?: string;
  default_top_k?: number;
  max_top_k?: number;
  similarity_threshold?: number;
  tool_calling_max_iterations?: number;
  tool_calling_enabled?: boolean;
  include_rag_instruction?: boolean;
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export const ragService = {
  /**
   * Get current chat configuration (singleton)
   */
  async getChatConfig(): Promise<ChatConfig> {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        throw new Error("No authentication token");
      }

      const response = await fetch(`${baseUrl}/rag/settings`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch chat config");
      }

      return await response.json();
    } catch (error) {
      console.error("[RagService] Error fetching chat config:", error);
      throw error;
    }
  },

  /**
   * Update chat configuration (singleton)
   */
  async updateChatConfig(
    config: ChatConfigUpdateRequest
  ): Promise<ChatConfig> {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        throw new Error("No authentication token");
      }

      const response = await fetch(`${baseUrl}/rag/settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || errorData.message || "Failed to update chat config"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("[RagService] Error updating chat config:", error);
      throw error;
    }
  },
};
