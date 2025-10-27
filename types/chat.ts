export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  sources?: any[] | null;
}

export interface ChatSession {
  id: string;
  user_id: string;
  model_id: string;
  prompt_id?: string | null;
  title?: string | null;
  status: "active" | "completed";
  total_messages: number;
  started_at: string;
  ended_at?: string | null;
}

export interface ChatSessionDetail extends ChatSession {
  messages: ChatMessage[];
}

export interface ChatSessionCreate {
  model_id: string;
  title?: string;
  prompt_id?: string;
}

export interface ChatSessionUpdate {
  title?: string;
  status?: "active" | "completed";
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  session_id: string;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

export interface SessionListResponse {
  sessions: ChatSession[];
  total: number;
}
