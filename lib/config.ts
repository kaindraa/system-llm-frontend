/**
 * Application Configuration
 * Centralized configuration for API endpoints and other settings
 */

export const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
};

export const API_BASE_URL = getApiBaseUrl();
