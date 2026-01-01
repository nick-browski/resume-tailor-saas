// HTTP Status Codes
export const HTTP_STATUS = {
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  MISSING_AUTHORIZATION_HEADER: "Missing or invalid authorization header",
  INVALID_TOKEN: "Invalid token",
  DOCUMENT_NOT_FOUND: "Document not found",
  DOCUMENT_NOT_FOUND_OR_ACCESS_DENIED: "Document not found or access denied",
  DOCUMENT_STATUS_INVALID: "Document status is {status}, expected 'parsed'",
  OPENROUTER_API_KEY_NOT_CONFIGURED: "OpenRouter API key is not configured",
  OPENROUTER_API_ERROR: "OpenRouter API error: {status} - {errorText}",
  EMPTY_RESPONSE_FROM_OPENROUTER: "Empty response from OpenRouter API",
  FAILED_TO_GENERATE_RESUME: "Failed to generate resume",
  SERVICE_ACCOUNT_KEY_REQUIRED:
    "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  HEALTH_CHECK: "ok",
} as const;

// Firebase Configuration
export const FIREBASE_CONFIG = {
  DEFAULT_PROJECT_ID: "demo-project",
  DOCUMENTS_COLLECTION_NAME: "documents",
} as const;

// Request Headers
export const REQUEST_HEADERS = {
  AUTHORIZATION_PREFIX: "Bearer ",
  CONTENT_TYPE_JSON: "application/json",
  HTTP_REFERER: "HTTP-Referer",
  X_TITLE: "X-Title",
} as const;

// OpenRouter Configuration
export const OPENROUTER_CONFIG = {
  API_URL: "https://openrouter.ai/api/v1/chat/completions",
  DEFAULT_MODEL: "google/gemini-flash-1.5:free",
  MAX_TOKENS: 4096,
  APPLICATION_TITLE: "Resume Tailor SaaS",
} as const;

// Document Status
export const DOCUMENT_STATUS = {
  PARSED: "parsed",
  GENERATING: "generating",
  GENERATED: "generated",
  FAILED: "failed",
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  POST: "POST",
} as const;

// CORS Configuration
export const CORS_CONFIG = {
  DEFAULT_ORIGIN: "http://localhost:3000",
} as const;
