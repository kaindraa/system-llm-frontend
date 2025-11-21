/**
 * RAG (Retrieval-Augmented Generation) Types
 *
 * Type definitions for RAG search functionality, document sources,
 * and RAG-related events in the chat interface.
 */

/**
 * Document source reference in a message
 * Used when LLM tool-calls semantic_search during message generation
 */
export interface RAGSource {
  /** Unique document identifier */
  document_id: string;

  /** Original filename of the document */
  document_name: string;

  /** PDF page number where content was found */
  page_number: number;

  /** Relevance score from vector similarity search (0-1) */
  similarity_score: number;

  /** Chunk index in the document (optional) */
  chunk_index?: number;
}

/**
 * Extended message type that includes RAG metadata
 * Used in chat to track whether a message involved RAG search
 */
export interface RAGMessage {
  /** User or assistant message */
  role: "user" | "assistant" | "system";

  /** Message content */
  content: string;

  /** When message was created */
  created_at?: string;

  /** Sources retrieved from RAG (if applicable) */
  sources?: RAGSource[];

  /** Whether this message triggered a RAG search */
  ragSearched?: boolean;
}

/**
 * RAG search event during streaming
 * Emitted by backend when LLM decides to search documents
 */
export interface RAGSearchEvent {
  /** Current search query */
  query?: string;

  /** Search status: "searching" | "completed" */
  status: "searching" | "completed";

  /** Number of results found (when completed) */
  results_count?: number;

  /** Search processing time in milliseconds */
  processing_time?: number;

  /** Error message if search failed */
  error?: string;
}

/**
 * RAG system configuration
 * Sent from backend for managing RAG behavior
 */
export interface RAGConfig {
  /** Unique identifier (always 1 - singleton pattern) */
  id: number;

  /** Default number of document chunks to retrieve */
  default_top_k: number;

  /** Maximum allowed chunks in single search */
  max_top_k: number;

  /** Minimum similarity score for results (0-1) */
  similarity_threshold: number;

  /** Max iterations for tool calling loop */
  tool_calling_max_iterations: number;

  /** Whether tool calling is enabled */
  tool_calling_enabled: boolean;

  /** Whether to include RAG instruction in system prompt */
  include_rag_instruction: boolean;

  /** Last update timestamp */
  updated_at: string;
}

/**
 * RAG search state in chat component
 * Tracks current RAG search operation
 */
export interface RAGSearchState {
  /** Whether RAG search is currently in progress */
  isSearching: boolean;

  /** Current search query being executed */
  query?: string;

  /** Number of results found */
  resultsCount?: number;

  /** Processing time of last search */
  processingTime?: number;

  /** Error message if search failed */
  error?: string;
}

/**
 * Refined prompt event during streaming
 * Emitted by backend when LLM is refining the user's prompt
 */
export interface RefinedPromptEvent {
  /** Original prompt text before refinement */
  original_prompt?: string;

  /** Status: "refining" while in progress */
  status: "refining" | "completed";

  /** Error message if refinement failed */
  error?: string;
}

/**
 * Refined prompt result after tool execution
 * Contains both original and refined versions
 */
export interface RefinedPromptResult {
  /** Original prompt as entered by user */
  original: string;

  /** Refined/improved prompt from LLM */
  refined: string;

  /** Whether refinement was successful */
  success: boolean;

  /** Error message if refinement failed */
  error?: string;
}

/**
 * Refined prompt state in chat component
 * Tracks refinement operation
 */
export interface RefinedPromptState {
  /** Whether prompt is currently being refined */
  isRefining: boolean;

  /** Original prompt being refined */
  originalPrompt?: string;

  /** Result after refinement (if completed) */
  result?: RefinedPromptResult;

  /** Error message if refinement failed */
  error?: string;
}

/**
 * Streaming event from backend
 * Used to parse Server-Sent Events (SSE) from chat endpoint
 */
export interface StreamingEvent {
  /** Event type identifier */
  type:
    | "user_message"
    | "refine_prompt"
    | "refine_prompt_result"
    | "rag_search"
    | "chunk"
    | "done"
    | "error"
    | "tool_call";

  /** Event data payload */
  data?: unknown;
}
