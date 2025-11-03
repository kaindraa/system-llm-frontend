/**
 * Conversation/Session Management Service
 * Handles all conversation-related API calls to the backend
 */

export interface Conversation {
  id: string;
  title: string;
  status: "active" | "completed";
  createdAt: string;
  updatedAt: string;
  totalMessages: number;
  model_id?: string;
  prompt_id?: string;
  prompt_name?: string;
}

export interface ConversationListResponse {
  sessions: Conversation[];
  total: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function getHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

/**
 * List all conversations for current user
 */
export async function listConversations(
  statusFilter?: string,
  limit: number = 50,
  offset: number = 0
): Promise<ConversationListResponse> {
  const params = new URLSearchParams();
  if (statusFilter) params.append("status_filter", statusFilter);
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  const response = await fetch(
    `${API_BASE}/chat/sessions?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to list conversations: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    sessions: data.sessions || [],
    total: data.total || 0,
  };
}

/**
 * Create a new conversation
 *
 * Note: Backend automatically uses the active prompt if available.
 * No need to specify prompt_id from frontend.
 */
export async function createConversation(
  title: string = "New Chat",
  modelId: string = "gpt-4.1-nano"
): Promise<Conversation> {
  const body = {
    title,
    model_id: modelId,
  };

  const response = await fetch(`${API_BASE}/chat/sessions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to create conversation: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    title: data.title,
    status: data.status?.toLowerCase() || "active",
    createdAt: data.started_at,
    updatedAt: data.started_at,
    totalMessages: data.total_messages || 0,
    model_id: data.model_id,
    prompt_id: data.prompt_id,
    prompt_name: data.prompt?.name || data.prompt_name,
  };
}

/**
 * Update conversation (rename, change status)
 */
export async function updateConversation(
  id: string,
  updates: Partial<{ title: string; status: string }>
): Promise<Conversation> {
  const response = await fetch(`${API_BASE}/chat/sessions/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update conversation: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    title: data.title,
    status: data.status?.toLowerCase() || "active",
    createdAt: data.started_at,
    updatedAt: data.started_at,
    totalMessages: data.total_messages || 0,
    model_id: data.model_id,
    prompt_id: data.prompt_id,
    prompt_name: data.prompt?.name || data.prompt_name,
  };
}

/**
 * Delete a conversation
 */
export async function deleteConversation(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/chat/sessions/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete conversation: ${response.statusText}`);
  }
}

/**
 * Get prompt name by ID
 */
export async function getPromptName(promptId: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/prompts/${promptId}`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.name || null;
  } catch (error) {
    console.error("[getPromptName] Error fetching prompt:", error);
    return null;
  }
}

interface MessageContentBlock {
  type?: string;
  text?: string;
}

interface ConversationMessage {
  role?: string;
  content?: string | Array<MessageContentBlock>;
}

/**
 * Get a specific conversation with all messages
 */
export async function getConversation(
  id: string
): Promise<Conversation & { messages: Array<ConversationMessage> }> {
  const response = await fetch(`${API_BASE}/chat/sessions/${id}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get conversation: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    title: data.title,
    status: data.status?.toLowerCase() || "active",
    createdAt: data.started_at,
    updatedAt: data.started_at,
    totalMessages: data.total_messages || 0,
    model_id: data.model_id,
    prompt_id: data.prompt_id,
    prompt_name: data.prompt?.name || data.prompt_name,
    messages: data.messages || [],
  };
}
