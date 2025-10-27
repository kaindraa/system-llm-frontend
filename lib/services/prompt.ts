import apiClient from "@/lib/api/client";

export interface Prompt {
  id: string;
  name: string;
  content: string;
  description?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PromptCreateRequest {
  name: string;
  content: string;
  description?: string;
  is_active?: boolean;
}

export interface PromptUpdateRequest {
  name?: string;
  content?: string;
  description?: string;
  is_active?: boolean;
}

export interface PromptListResponse {
  prompts: Prompt[];
  total: number;
  page: number;
  page_size: number;
}

export const promptService = {
  async listPrompts(
    skip: number = 0,
    limit: number = 10,
    search?: string
  ): Promise<PromptListResponse> {
    const params = new URLSearchParams();
    params.append("skip", skip.toString());
    params.append("limit", limit.toString());
    if (search) {
      params.append("search", search);
    }

    const response = await apiClient.get<PromptListResponse>(
      `/prompts?${params.toString()}`
    );
    return response.data;
  },

  async getPrompt(id: string): Promise<Prompt> {
    const response = await apiClient.get<Prompt>(`/prompts/${id}`);
    return response.data;
  },

  async createPrompt(data: PromptCreateRequest): Promise<Prompt> {
    const response = await apiClient.post<Prompt>("/prompts", data);
    return response.data;
  },

  async updatePrompt(id: string, data: PromptUpdateRequest): Promise<Prompt> {
    const response = await apiClient.put<Prompt>(`/prompts/${id}`, data);
    return response.data;
  },

  async deletePrompt(id: string): Promise<void> {
    await apiClient.delete(`/prompts/${id}`);
  },

  async activatePrompt(id: string): Promise<Prompt> {
    const response = await apiClient.patch<Prompt>(`/prompts/${id}/activate`);
    return response.data;
  },
};
