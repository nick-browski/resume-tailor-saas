export const WIZARD_CONSTANTS = {
  TOTAL_STEPS: 3,
  FIRST_STEP: 1,
  LAST_STEP: 3,
} as const;

export const FILE_CONSTANTS = {
  MAX_SIZE_MB: 10,
  ACCEPTED_TYPES: ".pdf",
  DEFAULT_FILENAME: "tailored-resume.md",
  MARKDOWN_MIME_TYPE: "text/markdown",
  PDF_MIME_TYPE: "pdf",
  BYTES_PER_KB: 1024,
} as const;

export const UPLOAD_MODE = {
  FILE: "file",
  TEXT: "text",
} as const;

export const TIMING_CONSTANTS = {
  UPLOAD_DELAY_MS: 500,
  GENERATION_DELAY_MS: 1000,
  DOWNLOAD_DELAY_MS: 500,
  DOCUMENT_POLL_INTERVAL_MS: 2000,
  DOCUMENT_POLL_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes
} as const;

export const QUERY_CONSTANTS = {
  STALE_TIME_MS: 5 * 60 * 1000,
  RETRY_COUNT: 1,
} as const;

export const TEXTAREA_CONSTANTS = {
  RESUME_ROWS: 10,
  JOB_DESCRIPTION_ROWS: 12,
} as const;

export const TOAST_MESSAGES = {
  RESUME_GENERATED_SUCCESS: "Resume generated successfully!",
  RESUME_GENERATION_FAILED: "Failed to generate resume",
  DOCUMENT_LOAD_FAILED: "Failed to load document",
  CREATING_DOCUMENT: "Creating document...",
  STARTING_RESUME_GENERATION: "Starting resume generation...",
  CREATE_DOCUMENT_OR_GENERATE_RESUME_FAILED:
    "Failed to create document or generate resume",
  RESUME_DOWNLOADED_SUCCESS: "Resume downloaded successfully",
  RESUME_DOWNLOAD_FAILED: "Failed to download resume",
} as const;

export const ERROR_MESSAGES = {
  USER_NOT_AUTHENTICATED: "User not authenticated",
  FAILED_TO_DOWNLOAD_PDF: "Failed to download PDF",
} as const;

export const UI_TEXT = {
  UPLOAD_RESUME_STEP_TITLE: "Step 1: Upload Your Resume",
  UPLOAD_RESUME_STEP_DESCRIPTION:
    "Upload your resume as a PDF file or paste it as text.",
  UPLOAD_PDF_BUTTON: "Upload PDF",
  PASTE_TEXT_BUTTON: "Paste Text",
  RESUME_PDF_LABEL: "Resume PDF",
  RESUME_TEXT_LABEL: "Resume Text",
  RESUME_TEXT_PLACEHOLDER: "Paste your resume content here...",
  UPLOAD_FILE_TEXT: "Upload a file",
  CHANGE_FILE_TEXT: "Change file",
  DRAG_AND_DROP_TEXT: "or drag and drop",
  PDF_SIZE_LIMIT_TEXT: "PDF up to",
  SELECTED_FILE_TEXT: "Selected:",
  GENERATING_RESUME_TEXT: "Generating resume...",
  CONTINUE_BUTTON: "Continue",
  FILE_SELECTED_SUCCESS: "File selected successfully",
  RESUME_UPLOADED_SUCCESS: "Resume uploaded successfully",
  RESUME_TEXT_SAVED: "Resume text saved",
  FILE_SIZE_EXCEEDS_LIMIT: "File size exceeds",
  MB_LIMIT_TEXT: "MB limit",
  PLEASE_UPLOAD_PDF: "Please upload a PDF file",
  PLEASE_SELECT_FILE: "Please select a file",
  PLEASE_ENTER_RESUME_TEXT: "Please enter resume text",
  JOB_DESCRIPTION_STEP_TITLE: "Step 2: Paste Job Description",
  JOB_DESCRIPTION_STEP_DESCRIPTION:
    "Paste the job description you want to tailor your resume for.",
  JOB_DESCRIPTION_LABEL: "Job Description",
  JOB_DESCRIPTION_PLACEHOLDER:
    "Paste the complete job description here, including requirements, responsibilities, and qualifications...",
  CHARACTERS_LABEL: "characters",
  BACK_BUTTON: "Back",
  GENERATING_BUTTON: "Generating...",
  GENERATE_TAILORED_RESUME_BUTTON: "Generate Tailored Resume",
  PREVIEW_STEP_TITLE: "Step 3: Preview & Download",
  PREVIEW_STEP_DESCRIPTION:
    "Review your tailored resume and download it when ready.",
  TAILORED_RESUME_PREVIEW_LABEL: "Tailored Resume Preview",
  LOADING_TEXT: "Loading...",
  LOADING_DOCUMENT_TEXT: "Loading document...",
  GENERATING_TAILORED_RESUME_TEXT: "Generating tailored resume... Please wait.",
  GENERATION_FAILED_PREFIX: "Generation failed:",
  UNKNOWN_ERROR_TEXT: "Unknown error",
  NO_RESUME_AVAILABLE_TEXT: "No resume available yet.",
  PDF_READY_TEXT: "Your tailored resume PDF is ready for download.",
  CLICK_DOWNLOAD_BUTTON_TEXT:
    "Click the download button below to get your PDF.",
  START_OVER_BUTTON: "Start Over",
  DOWNLOADING_TEXT: "Downloading...",
  DOWNLOAD_RESUME_BUTTON: "Download Resume",
} as const;

export const QUERY_KEYS = {
  DOCUMENTS: "documents",
  DOCUMENT: "document",
} as const;

export const MOBILE_CONSTANTS = {
  BREAKPOINT_WIDTH_PX: 768,
  MOBILE_USER_AGENT_PATTERN: /iPhone|iPad|iPod|Android/i,
} as const;

export const PDF_CONSTANTS = {
  A4_WIDTH_PX: 794,
  MIN_SCALE: 0.4,
  MAX_SCALE: 1.0,
} as const;

export const DOCUMENT_STATUS = {
  PARSED: "parsed",
  GENERATING: "generating",
  GENERATED: "generated",
  FAILED: "failed",
} as const;

export const ORIGINAL_PARSE_STATUS = {
  PARSING: "parsing",
  PARSED: "parsed",
  FAILED: "failed",
} as const;
