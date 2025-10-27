import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Trim a title to a maximum length with ellipsis
 * @param text - The text to trim
 * @param maxLength - Maximum length (default: 50)
 * @returns Trimmed text with ellipsis if needed
 */
export function trimTitle(text: string, maxLength: number = 50): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}
