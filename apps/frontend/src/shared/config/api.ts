// API configuration
export const API_CONFIG = {
  documentsApi: import.meta.env.VITE_DOCUMENTS_API_URL || "http://localhost:8080",
  generateApi: import.meta.env.VITE_GENERATE_API_URL || "http://localhost:8081",
} as const;

