"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RAGConfig } from "@/lib/types/rag";

interface RAGSettingsFormProps {
  /** API base URL for backend */
  apiUrl?: string;

  /** Callback when settings are saved */
  onSave?: (config: RAGConfig) => void;
}

/**
 * RAG Settings Form Component
 *
 * Admin panel for managing RAG system configuration.
 * Allows tuning of search parameters, thresholds, and tool calling behavior.
 */
export const RAGSettingsForm = ({
  apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1",
  onSave,
}: RAGSettingsFormProps) => {
  const [config, setConfig] = useState<RAGConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    default_top_k: 5,
    max_top_k: 10,
    similarity_threshold: 0.7,
    tool_calling_max_iterations: 10,
    tool_calling_enabled: true,
    include_rag_instruction: true,
  });

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/rag/settings`);

      if (!response.ok) {
        throw new Error("Failed to load RAG settings");
      }

      const data = await response.json();
      setConfig(data);
      setFormData({
        default_top_k: data.default_top_k,
        max_top_k: data.max_top_k,
        similarity_threshold: data.similarity_threshold,
        tool_calling_max_iterations: data.tool_calling_max_iterations,
        tool_calling_enabled: data.tool_calling_enabled,
        include_rag_instruction: data.include_rag_instruction,
      });
      setMessage(null);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load settings",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const response = await fetch(`${apiUrl}/rag/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save RAG settings");
      }

      const updatedConfig = await response.json();
      setConfig(updatedConfig);
      setMessage({
        type: "success",
        text: "RAG settings updated successfully!",
      });

      onSave?.(updatedConfig);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save settings",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsSaving(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const response = await fetch(`${apiUrl}/rag/settings/reset`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to reset RAG settings");
      }

      const resetConfig = await response.json();
      setConfig(resetConfig);
      setFormData({
        default_top_k: resetConfig.default_top_k,
        max_top_k: resetConfig.max_top_k,
        similarity_threshold: resetConfig.similarity_threshold,
        tool_calling_max_iterations: resetConfig.tool_calling_max_iterations,
        tool_calling_enabled: resetConfig.tool_calling_enabled,
        include_rag_instruction: resetConfig.include_rag_instruction,
      });

      setMessage({
        type: "success",
        text: "RAG settings reset to defaults!",
      });

      onSave?.(resetConfig);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to reset settings",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">RAG Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure Retrieval-Augmented Generation parameters
        </p>
        {config && (
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {new Date(config.updated_at).toLocaleString()}
          </p>
        )}
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg",
            message.type === "success"
              ? "bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200"
              : "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-muted/30 p-6 rounded-lg">
        {/* Semantic Search Settings */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Semantic Search</h3>

          {/* Default Top K */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Default Results (top_k)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.default_top_k}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  default_top_k: parseInt(e.target.value) || 5,
                })
              }
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Default number of document chunks to retrieve per search
            </p>
          </div>

          {/* Max Top K */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Maximum Results (max_top_k)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.max_top_k}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_top_k: parseInt(e.target.value) || 10,
                })
              }
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum number of results allowed in a single search
            </p>
          </div>

          {/* Similarity Threshold */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Similarity Threshold: {formData.similarity_threshold.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={formData.similarity_threshold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  similarity_threshold: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum similarity score for results (0 = lowest, 1 = highest)
            </p>
          </div>
        </div>

        {/* Tool Calling Settings */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold text-sm">Tool Calling</h3>

          {/* Tool Calling Max Iterations */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Max Tool Iterations
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.tool_calling_max_iterations}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tool_calling_max_iterations: parseInt(e.target.value) || 10,
                })
              }
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum number of tool calling iterations in agentic loop
            </p>
          </div>

          {/* Tool Calling Enabled */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="tool_calling_enabled"
              checked={formData.tool_calling_enabled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tool_calling_enabled: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="tool_calling_enabled" className="text-sm font-medium cursor-pointer">
              Enable Tool Calling
            </label>
          </div>

          {/* Include RAG Instruction */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="include_rag_instruction"
              checked={formData.include_rag_instruction}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  include_rag_instruction: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="include_rag_instruction" className="text-sm font-medium cursor-pointer">
              Include RAG Instruction in System Prompt
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
          >
            Reset to Defaults
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
