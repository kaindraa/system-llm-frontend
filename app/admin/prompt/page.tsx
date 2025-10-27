"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptList } from "@/components/admin/prompt-list";
import { PromptFormModal } from "@/components/admin/prompt-form-modal";
import {
  promptService,
  type Prompt,
  type PromptCreateRequest,
  type PromptUpdateRequest,
} from "@/lib/services/prompt";

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

  // Initial load
  useEffect(() => {
    loadPrompts(1);
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Prompts</h1>
          <p className="text-sm text-muted-foreground">
            Manage system prompts for chat sessions
          </p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="mr-2 h-4 w-4" />
          Create Prompt
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search prompts..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Prompt List */}
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
