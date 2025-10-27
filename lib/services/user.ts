/**
 * User Admin Service
 * Handles all user-related API calls for admin panel
 */

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

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
  chat_count: number;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  page_size: number;
}

export interface ChatSession {
  id: string;
  title: string;
  status: string;
  total_messages: number;
  started_at: string;
  ended_at: string | null;
  model_id: string;
  prompt_id: string | null;
}

export interface UserChatsResponse {
  user_id: string;
  user_email: string;
  user_name: string;
  sessions: ChatSession[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * List all users with chat counts
 */
export async function listUsers(
  skip: number = 0,
  limit: number = 50,
  search?: string
): Promise<UserListResponse> {
  const params = new URLSearchParams();
  params.append("skip", skip.toString());
  params.append("limit", limit.toString());
  if (search) {
    params.append("search", search);
  }

  const response = await fetch(
    `${API_BASE}/users?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to list users: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all chats for a specific user
 */
export async function getUserChats(
  userId: string,
  skip: number = 0,
  limit: number = 50
): Promise<UserChatsResponse> {
  const params = new URLSearchParams();
  params.append("skip", skip.toString());
  params.append("limit", limit.toString());

  const response = await fetch(
    `${API_BASE}/users/${userId}/chats?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get user chats: ${response.statusText}`);
  }

  return response.json();
}
