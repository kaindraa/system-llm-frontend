"use client";

import { useState, useEffect } from "react";
import { Plus, Save, Loader2, X, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptList } from "@/components/admin/prompt-list";
import { PromptFormModal } from "@/components/admin/prompt-form-modal";
import {
  promptService,
  type Prompt,
  type PromptCreateRequest,
  type PromptUpdateRequest,
} from "@/lib/services/prompt";
import { ragService, type ChatConfig } from "@/lib/services/rag";

const PAGE_SIZE = 10;

export default function PromptPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | undefined>();
  const [isFormLoading, setIsFormLoading] = useState(false);

  // General prompt (chat config) state
  const [chatConfig, setChatConfig] = useState<ChatConfig | null>(null);
  const [generalPrompt, setGeneralPrompt] = useState("");
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [generalPromptError, setGeneralPromptError] = useState<string | null>(null);
  const [generalPromptSuccess, setGeneralPromptSuccess] = useState<string | null>(null);

  // Analysis prompt state
  const [analysisPrompt, setAnalysisPrompt] = useState("");
  const [isEditingAnalysis, setIsEditingAnalysis] = useState(false);
  const [isSavingAnalysis, setIsSavingAnalysis] = useState(false);
  const [analysisPromptError, setAnalysisPromptError] = useState<string | null>(null);
  const [analysisPromptSuccess, setAnalysisPromptSuccess] = useState<string | null>(null);

  // Load prompts
  const loadPrompts = async (page: number = 1, search?: string) => {
    setIsLoading(true);
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const response = await promptService.listPrompts(skip, PAGE_SIZE, search);
      setPrompts(response.prompts);
      setTotal(response.total);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error loading prompts:", error);
      alert("Failed to load prompts");
    } finally {
      setIsLoading(false);
    }
  };

  // Load general prompt (chat config)
  const loadGeneralPrompt = async () => {
    try {
      const config = await ragService.getChatConfig();
      console.log("[Prompt Page] Loaded chat config:", config);
      setChatConfig(config);
      setGeneralPrompt(config.prompt_general || "");
      setGeneralPromptError(null);
    } catch (error) {
      console.error("Error loading chat config:", error);
      setGeneralPromptError("Failed to load general prompt");
      // Set empty config to still show the section
      setChatConfig({
        id: 0,
        prompt_general: "",
        default_top_k: 5,
        max_top_k: 10,
        similarity_threshold: 0.7,
        tool_calling_max_iterations: 10,
        tool_calling_enabled: true,
        include_rag_instruction: true,
        updated_at: new Date().toISOString(),
      });
    }
  };

  // Save general prompt (chat config)
  const handleSaveGeneralPrompt = async () => {
    setIsSavingGeneral(true);
    setGeneralPromptError(null);
    setGeneralPromptSuccess(null);
    try {
      await ragService.updateChatConfig({ prompt_general: generalPrompt });
      setGeneralPromptSuccess("General prompt saved successfully");
      setIsEditingGeneral(false);
      await loadGeneralPrompt();
      // Clear success message after 3 seconds
      setTimeout(() => setGeneralPromptSuccess(null), 3000);
    } catch (error) {
      console.error("Error saving general prompt:", error);
      setGeneralPromptError(
        error instanceof Error ? error.message : "Failed to save general prompt"
      );
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleCancelEditGeneral = () => {
    if (chatConfig) {
      setGeneralPrompt(chatConfig.prompt_general);
    }
    setIsEditingGeneral(false);
    setGeneralPromptError(null);
  };

  // Load analysis prompt
  const loadAnalysisPrompt = async () => {
    try {
      const config = await ragService.getChatConfig();
      console.log("[Prompt Page] Loaded chat config for analysis prompt:", config);
      setAnalysisPrompt(config.prompt_analysis || "");
      setAnalysisPromptError(null);
    } catch (error) {
      console.error("Error loading analysis prompt:", error);
      setAnalysisPromptError("Failed to load analysis prompt");
      setAnalysisPrompt("");
    }
  };

  // Save analysis prompt
  const handleSaveAnalysisPrompt = async () => {
    setIsSavingAnalysis(true);
    setAnalysisPromptError(null);
    setAnalysisPromptSuccess(null);
    try {
      await ragService.updateChatConfig({ prompt_analysis: analysisPrompt });
      setAnalysisPromptSuccess("Analysis prompt saved successfully");
      setIsEditingAnalysis(false);
      await loadAnalysisPrompt();
      // Clear success message after 3 seconds
      setTimeout(() => setAnalysisPromptSuccess(null), 3000);
    } catch (error) {
      console.error("Error saving analysis prompt:", error);
      setAnalysisPromptError(
        error instanceof Error ? error.message : "Failed to save analysis prompt"
      );
    } finally {
      setIsSavingAnalysis(false);
    }
  };

  const handleCancelEditAnalysis = () => {
    setIsEditingAnalysis(false);
    setAnalysisPromptError(null);
    // Reload to reset the value
    loadAnalysisPrompt();
  };

  // Initial load
  useEffect(() => {
    loadPrompts(1);
    loadGeneralPrompt();
    loadAnalysisPrompt();
  }, []);

  // Handle create/update
  const handleFormSubmit = async (
    data: PromptCreateRequest | PromptUpdateRequest
  ) => {
    setIsFormLoading(true);
    try {
      if (editingPrompt) {
        // Update
        await promptService.updatePrompt(editingPrompt.id, data);
        alert("Prompt updated successfully");
      } else {
        // Create
        await promptService.createPrompt(data as PromptCreateRequest);
        alert("Prompt created successfully");
      }

      // Reload prompts
      await loadPrompts(currentPage, searchTerm);
      setEditingPrompt(undefined);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to save prompt");
    } finally {
      setIsFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await promptService.deletePrompt(id);
      alert("Prompt deleted successfully");
      await loadPrompts(currentPage, searchTerm);
    } catch (error) {
      console.error("Error deleting prompt:", error);
      alert("Failed to delete prompt");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle activate
  const handleActivate = async (id: string) => {
    setIsLoading(true);
    try {
      await promptService.activatePrompt(id);
      alert("Prompt activated successfully");
      await loadPrompts(currentPage, searchTerm);
    } catch (error) {
      console.error("Error activating prompt:", error);
      alert("Failed to activate prompt");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    loadPrompts(1, value);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    loadPrompts(page, searchTerm);
  };

  // Handle open form
  const handleOpenForm = (prompt?: Prompt) => {
    setEditingPrompt(prompt);
    setIsFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 px-6 py-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold tracking-tight">System Prompts</h1>
        <p className="text-base text-muted-foreground max-w-2xl">
          Create and manage system prompts for LLM conversations
        </p>
      </div>

      {/* General Prompt Section */}
      {chatConfig && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-foreground">General System Prompt</h2>
            <p className="text-sm text-muted-foreground mt-1">
              This prompt is prepended to all LLM conversations
            </p>
          </div>

          <div className="p-6">
            {generalPromptError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {generalPromptError}
              </div>
            )}

            {generalPromptSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700 text-sm">
                {generalPromptSuccess}
              </div>
            )}

            {isEditingGeneral ? (
              <div className="space-y-4">
                <textarea
                  value={generalPrompt}
                  onChange={(e) => setGeneralPrompt(e.target.value)}
                  placeholder="Enter the general system prompt that will be used for all conversations..."
                  rows={8}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveGeneralPrompt}
                    disabled={isSavingGeneral}
                    className="gap-2"
                  >
                    {isSavingGeneral && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSavingGeneral ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEditGeneral}
                    disabled={isSavingGeneral}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg border border-input min-h-32">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {generalPrompt || "(No general prompt set)"}
                  </p>
                </div>
                <Button
                  onClick={() => setIsEditingGeneral(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Prompt
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analysis Prompt Section */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-foreground">Analysis Prompt</h2>
          <p className="text-sm text-muted-foreground mt-1">
            This prompt is used to analyze student learning sessions
          </p>
        </div>

        <div className="p-6">
          {analysisPromptError && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {analysisPromptError}
            </div>
          )}

          {analysisPromptSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700 text-sm">
              {analysisPromptSuccess}
            </div>
          )}

          {isEditingAnalysis ? (
            <div className="space-y-4">
              <textarea
                value={analysisPrompt}
                onChange={(e) => setAnalysisPrompt(e.target.value)}
                placeholder="Enter the analysis prompt that will be used to analyze student sessions..."
                rows={8}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveAnalysisPrompt}
                  disabled={isSavingAnalysis}
                  className="gap-2"
                >
                  {isSavingAnalysis && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSavingAnalysis ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEditAnalysis}
                  disabled={isSavingAnalysis}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg border border-input min-h-32">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {analysisPrompt || "(No analysis prompt set)"}
                </p>
              </div>
              <Button
                onClick={() => setIsEditingAnalysis(true)}
                variant="outline"
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Prompt
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters Card with Create Button */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <Button
            onClick={() => handleOpenForm()}
            size="default"
            className="gap-2 flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Prompt
          </Button>
        </div>
      </div>

      {/* Content Card */}
      <div className="rounded-lg border bg-card">
        {/* Prompt List */}
        <div className="p-6">
          <PromptList
            prompts={prompts}
            total={total}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            isLoading={isLoading}
            onEdit={(prompt) => handleOpenForm(prompt)}
            onDelete={handleDelete}
            onActivate={handleActivate}
            onCreateNew={() => handleOpenForm()}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Form Modal */}
      <PromptFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPrompt(undefined);
        }}
        onSubmit={handleFormSubmit}
        prompt={editingPrompt}
        isLoading={isFormLoading}
      />
    </div>
  );
}
