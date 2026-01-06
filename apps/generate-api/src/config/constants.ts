// Determine if running in Cloud Run (K_SERVICE is set automatically by Cloud Run)
export const IS_CLOUD_RUN = !!process.env.K_SERVICE;

// Environment: dev, staging, prod (defaults to "dev" if not set)
export const APP_ENV = process.env.APP_ENV || "dev";

// Development mode: only when explicitly "dev" and not in Cloud Run
export const IS_DEV = APP_ENV === "dev" && !IS_CLOUD_RUN;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
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
  MISTRAL_API_KEY_NOT_CONFIGURED: "Mistral API key is not configured",
  MISTRAL_API_ERROR: "Mistral API error: {status} - {errorText}",
  EMPTY_RESPONSE_FROM_MISTRAL: "Empty response from Mistral API",
  FAILED_TO_GENERATE_RESUME: "Failed to generate resume",
  SERVICE_ACCOUNT_KEY_REQUIRED:
    "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required",
  DOCUMENT_HAS_NO_RESUME_TEXT: "Document has no resume text to parse",
  FAILED_TO_ENQUEUE_GENERATION_TASK: "Failed to enqueue generation task",
  SERVICE_URL_NOT_CONFIGURED:
    "SERVICE_URL or GENERATE_API_URL environment variable is required",
  SERVICE_URL_NOT_CONFIGURED_CLOUD_RUN:
    "SERVICE_URL environment variable is required. It should be set by the deployment script using the actual Cloud Run service URL.",
  MISSING_REQUIRED_FIELDS_GENERATION:
    "Missing required fields: documentId, resumeText, jobText, ownerId",
  MISSING_REQUIRED_FIELDS_PARSE:
    "Missing required fields: documentId, resumeText, ownerId",
  FAILED_TO_PROCESS_GENERATION: "Failed to process generation",
  FAILED_TO_UPDATE_STATUS_TO_FAILED:
    "Failed to update status to FAILED for document",
  FAILED_TO_UPDATE_PARSE_STATUS_TO_FAILED:
    "Failed to update originalParseStatus to FAILED for document",
  ERROR_PROCESSING_GENERATION: "Error processing generation for document",
  ERROR_PARSING_ORIGINAL_RESUME: "Error parsing original resume for document",
  UNKNOWN_ERROR: "Unknown error",
  VALIDATION_FAILED: "Validation failed",
  FILE_OR_RESUME_TEXT_REQUIRED: "Either file or resumeText is required",
  FAILED_TO_CLASSIFY_CONTENT: "Failed to classify content",
  FAILED_TO_EDIT_RESUME: "Failed to edit resume",
  EDIT_PROMPT_EMPTY: "Edit prompt cannot be empty",
  RESUME_TEXT_EMPTY: "Resume text is empty",
  JOB_DESCRIPTION_TEXT_EMPTY: "Job description text is empty",
  FAILED_TO_ANALYZE_RESUME_CONTENT: "Failed to analyze resume content",
  FAILED_TO_ANALYZE_JOB_DESCRIPTION_CONTENT:
    "Failed to analyze job description content",
  FAILED_TO_PARSE_EXISTING_RESUME_DATA: "Failed to parse existing resume data",
  FAILED_TO_EXTRACT_TEXT_FROM_PDF: "Failed to extract text from PDF file",
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
} as const;

// Mistral Configuration
export const MISTRAL_CONFIG = {
  API_URL: "https://api.mistral.ai/v1/chat/completions",
  DEFAULT_MODEL: "mistral-small-latest",
  MAX_TOKENS: 1024,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  REQUEST_TIMEOUT_MS: 60000,
  RETRIABLE_STATUS_CODES: [429, 500, 502, 503, 504],
  UNAUTHORIZED_STATUS_CODE: 401,
  CLASSIFICATION_MAX_TOKENS: 512,
  CLASSIFICATION_MAX_TEXT_LENGTH: 2000,
  MINIMUM_CONFIDENCE_THRESHOLD: 0.5,
} as const;

// Match Check Configuration
export const MATCH_CHECK_CONFIG = {
  ERROR_MESSAGE_ANALYSIS_FAILED: "Failed to analyze match compatibility",
  ERROR_MESSAGE_COMPATIBILITY_FAILED:
    "Failed to analyze resume and job description compatibility",
} as const;

// JSON Extraction Patterns
export const JSON_EXTRACTION_PATTERNS = {
  MARKDOWN_JSON_START: /^```json\s*/i,
  MARKDOWN_CODE_START: /^```\s*/,
  MARKDOWN_CODE_END: /\s*```\s*$/,
  JSON_START_CHARACTER: "{",
  JSON_END_CHARACTER: "}",
} as const;

// Mistral Message Roles
export const MISTRAL_MESSAGE_ROLES = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
} as const;

// Document Status
export const DOCUMENT_STATUS = {
  PARSED: "parsed",
  GENERATING: "generating",
  GENERATED: "generated",
  FAILED: "failed",
} as const;

// Original Parse Status (for Firestore document field)
export const FIRESTORE_PARSE_STATUS = {
  PARSING: "parsing",
  PARSED: "parsed",
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

// API Routes
export const API_ROUTES = {
  DOCUMENTS: "/documents",
  TASKS_PROCESS_GENERATION: "/tasks/process-generation",
  TASKS_PROCESS_PARSE_ORIGINAL: "/tasks/process-parse-original",
  TASKS_PROCESS_EDIT_RESUME: "/tasks/process-edit-resume",
  HEALTH: "/health",
} as const;

// Server Configuration
export const SERVER_CONFIG = {
  DEFAULT_PORT: 8081,
  LOCALHOST_IP: "127.0.0.1",
  ALL_INTERFACES_IP: "0.0.0.0",
} as const;

// Parse Original API Response Status
export const PARSE_RESPONSE_STATUS = {
  CACHED: "cached",
  PARSED: "parsed",
  QUEUED: "queued",
} as const;

// Storage Configuration
export const STORAGE_CONFIG = {
  RESUMES_FOLDER: "resumes",
  PDF_CONTENT_TYPE: "application/pdf",
} as const;

// PDF Generation Configuration
export const PDF_CONFIG = {
  FORMAT: "A4" as const,
  MARGIN_MM: "10mm",
  HTML_TITLE: "Resume",
  HTML_LANG: "en",
  MAX_PAGES: 1 as number,
  SCALE_STEP: 0.05,
  MIN_SCALE: 0.7,
  INITIAL_SCALE: 1.0,
  A4_HEIGHT_PX: 1123,
  // Chromium launch arguments for Cloud Run compatibility
  CHROMIUM_ARGS: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--single-process",
  ],
};
