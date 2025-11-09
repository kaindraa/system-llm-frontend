"use client";

import type { FC } from "react";
import {
  Trash2,
  Edit2,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Prompt } from "@/lib/services/prompt";

interface PromptListProps {
  prompts: Prompt[];
  total: number;
  currentPage: number;
  pageSize: number;
  isLoading?: boolean;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
  onActivate: (id: string) => void;
  onCreateNew: () => void;
  onPageChange: (page: number) => void;
}

export const PromptList: FC<PromptListProps> = ({
  prompts,
  total,
  currentPage,
  pageSize,
  isLoading = false,
  onEdit,
  onDelete,
  onActivate,
  onCreateNew,
  onPageChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, total);

  if (isLoading && prompts.length === 0) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!isLoading && prompts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/25 p-12">
        <div className="text-center">
          <Plus className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">No prompts yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Create your first system prompt
          </p>
          <Button onClick={onCreateNew}>Create Prompt</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Prompt
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold w-24">
                Active
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {prompts.map((prompt) => (
              <tr key={prompt.id} className="border-b hover:bg-muted/50">
                {/* Name */}
                <td className="px-4 py-3">
                  <p className="font-medium">{prompt.name}</p>
                </td>

                {/* Prompt Content */}
                <td className="px-4 py-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {prompt.content || "-"}
                  </p>
                </td>

                {/* Active Status */}
                <td className="px-4 py-3 text-center">
                  {prompt.is_active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      Inactive
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {!prompt.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onActivate(prompt.id)}
                        title="Activate this prompt"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(prompt)}
                      title="Edit prompt"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to delete "${prompt.name}"?`
                          )
                        ) {
                          onDelete(prompt.id);
                        }
                      }}
                      title="Delete prompt"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startIndex} to {endIndex} of {total} results
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1;
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  disabled={isLoading}
                >
                  {page}
                </Button>
              );
            } else if (
              (page === currentPage - 2 || page === currentPage + 2) &&
              totalPages > 5
            ) {
              return (
                <span key={page} className="px-2 py-1">
                  ...
                </span>
              );
            }
            return null;
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
