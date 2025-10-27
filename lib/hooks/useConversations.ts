/**
 * Hook untuk manage conversations dari backend
 */

import { useState, useEffect, useCallback } from "react";
import {
  listConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  type Conversation,
} from "@/lib/services/conversation";

export interface UseConversationsState {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  activeConversationId: string | null;
}

export function useConversations() {
  const [state, setState] = useState<UseConversationsState>({
    conversations: [],
    isLoading: true,
    error: null,
    activeConversationId: null,
  });

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await listConversations();
      setState((prev) => ({
        ...prev,
        conversations: data.sessions,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to load conversations",
        isLoading: false,
      }));
    }
  }, []);

  const createNew = useCallback(async (title?: string) => {
    try {
      const newConversation = await createConversation(title, "gpt-4.1-nano");
      setState((prev) => ({
        ...prev,
        conversations: [newConversation, ...prev.conversations],
        activeConversationId: newConversation.id,
      }));
      return newConversation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create conversation";
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const rename = useCallback(async (id: string, newTitle: string) => {
    try {
      const updated = await updateConversation(id, { title: newTitle });
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((c) =>
          c.id === id ? { ...c, title: updated.title } : c
        ),
      }));
      return updated;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to rename conversation";
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const delete_ = useCallback(async (id: string) => {
    try {
      await deleteConversation(id);
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.filter((c) => c.id !== id),
        activeConversationId:
          prev.activeConversationId === id ? null : prev.activeConversationId,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete conversation";
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const setActive = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, activeConversationId: id }));
  }, []);

  return {
    ...state,
    loadConversations,
    createNew,
    rename,
    delete: delete_,
    setActive,
  };
}
