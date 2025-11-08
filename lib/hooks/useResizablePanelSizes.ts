import { useEffect, useState } from "react";

const STORAGE_KEY = "system-llm-panel-sizes";

export interface PanelSizes {
  left: number;
  center: number;
  right: number;
}

const DEFAULT_SIZES: PanelSizes = {
  left: 20, // 20% - sidebar kiri
  center: 55, // 55% - chat area
  right: 25, // 25% - document viewer
};

export const useResizablePanelSizes = () => {
  const [sizes, setSizes] = useState<PanelSizes>(DEFAULT_SIZES);
  const [isLoading, setIsLoading] = useState(true);

  // Load sizes dari localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSizes(parsed);
      }
    } catch (error) {
      console.error("[useResizablePanelSizes] Error loading sizes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save sizes ke localStorage whenever they change
  const saveSizes = (newSizes: PanelSizes) => {
    setSizes(newSizes);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSizes));
      console.log("[useResizablePanelSizes] Sizes saved:", newSizes);
    } catch (error) {
      console.error("[useResizablePanelSizes] Error saving sizes:", error);
    }
  };

  // Reset ke default sizes
  const resetSizes = () => {
    saveSizes(DEFAULT_SIZES);
  };

  return {
    sizes,
    saveSizes,
    resetSizes,
    isLoading,
  };
};
