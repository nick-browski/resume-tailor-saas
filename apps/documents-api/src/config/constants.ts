// HTTP Status Codes
export const HTTP_STATUS = {
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  MISSING_AUTHORIZATION_HEADER: "Missing or invalid authorization header",
  INVALID_TOKEN: "Invalid token",
  DOCUMENT_NOT_FOUND: "Document not found",
  FILE_OR_TEXT_REQUIRED: "Either file or resumeText is required",
  FAILED_TO_CREATE_DOCUMENT: "Failed to create document",
  FAILED_TO_FETCH_DOCUMENTS: "Failed to fetch documents",
  FAILED_TO_FETCH_DOCUMENT: "Failed to fetch document",
  PDF_FILE_NOT_FOUND: "PDF file not found",
  FAILED_TO_DOWNLOAD_PDF: "Failed to download PDF",
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

// Storage Configuration
export const STORAGE_CONFIG = {
  RESUMES_FOLDER: "resumes",
  PDF_CONTENT_TYPE: "application/pdf",
  PDF_DOWNLOAD_FILENAME: "tailored-resume.pdf",
  PDF_CONTENT_DISPOSITION_ATTACHMENT: "attachment",
} as const;

// Storage Error Messages (for error detection)
export const STORAGE_ERROR_PATTERNS = {
  FILE_DOES_NOT_EXIST: "does not exist",
  NO_SUCH_OBJECT: "No such object",
} as const;

// Request Headers
export const REQUEST_HEADERS = {
  AUTHORIZATION_PREFIX: "Bearer ",
} as const;

// Document Status
export const DOCUMENT_STATUS = {
  PARSED: "parsed",
} as const;

// CORS Configuration
export const CORS_CONFIG = {
  DEFAULT_ORIGIN: "http://localhost:3000",
} as const;
