"use client";

import { AlertCircle } from "lucide-react";
import type { RefinedPromptResult } from "@/lib/types/rag";

interface RefinedPromptResultProps {
  result?: RefinedPromptResult;
}

/**
 * Refined Prompt Result Component
 * Displays refined prompt as simple text with reduced opacity
 * Shows only the refined text, no box or collapsible
 */
export const RefinedPromptResultComponent = ({
  result,
}: RefinedPromptResultProps) => {
  if (!result) {
    return null;
  }

  console.log("[RefinedPromptResultComponent] Received result:", result);
  console.log("[RefinedPromptResultComponent] result.refined type:", typeof result.refined, "value:", result.refined);

  if (!result.success) {
    return (
      <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400 flex gap-2">
        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Prompt refinement failed</p>
          {result.error && <p className="text-xs opacity-75">{result.error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
        Refined prompt:
      </p>
      <div className="text-xs text-gray-600 dark:text-gray-400 opacity-80 whitespace-pre-wrap break-words">
        {result.refined}
      </div>
    </div>
  );
};
