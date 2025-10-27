"use client";

import type { FC } from "react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Prompt, PromptCreateRequest, PromptUpdateRequest } from "@/lib/services/prompt";

interface PromptFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PromptCreateRequest | PromptUpdateRequest) => Promise<void>;
  prompt?: Prompt;
  isLoading?: boolean;
}

export const PromptFormModal: FC<PromptFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prompt,
  isLoading = false,
}) => {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(false);

  // Reset form when prompt changes or modal closes
  useEffect(() => {
    if (prompt) {
      setName(prompt.name);
      setContent(prompt.content);
      setDescription(prompt.description || "");
      setIsActive(prompt.is_active);
    } else {
      setName("");
      setContent("");
      setDescription("");
      setIsActive(false);
    }
  }, [prompt, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !content.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const data = {
        name: name.trim(),
        content: content.trim(),
        description: description.trim() || undefined,
        is_active: isActive,
      };

      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {prompt ? "Edit Prompt" : "Create New Prompt"}
          </DialogTitle>
          <DialogDescription>
            {prompt
              ? "Edit the system prompt details below"
              : "Create a new system prompt for chat sessions"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Prompt Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Python Tutor, Math Helper"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Content Field */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Prompt Content <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="content"
              placeholder="Enter the system prompt content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
              required
              rows={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Optional description for this prompt"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 rounded border border-input"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Set as Active Prompt
            </Label>
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : prompt ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
