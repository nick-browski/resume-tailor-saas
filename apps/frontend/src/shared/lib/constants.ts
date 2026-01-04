export const WIZARD_CONSTANTS = {
  INITIAL_STEP: 0,
  TOTAL_STEPS_EDIT_SCENARIO: 2,
  TOTAL_STEPS_TAILOR_SCENARIO: 2,
  FIRST_STEP: 1,
  LAST_STEP_EDIT_SCENARIO: 2,
  LAST_STEP_TAILOR_SCENARIO: 2,
} as const;

// Animation timing constants
export const ANIMATION_CONSTANTS = {
  TOAST_ENTER_DURATION_MS: 300,
  TOAST_EXIT_DURATION_MS: 250,
  TOAST_DEFAULT_DURATION_MS: 5000,
  TOAST_EASING: "cubic-bezier(0.4, 0, 0.2, 1)",
  MODAL_ENTER_DURATION_MS: 300,
  MODAL_EXIT_DURATION_MS: 250,
  MODAL_EASING: "cubic-bezier(0.4, 0, 0.2, 1)",
  MODAL_BACKDROP_EASING: "cubic-bezier(0.4, 0, 0.2, 1)",
  WIZARD_STEP_TRANSITION_DURATION_MS: 300,
  WIZARD_STEP_EASING: "cubic-bezier(0.4, 0, 0.2, 1)",
  WIZARD_STEP_SLIDE_DISTANCE_PX: 20,
  LOADER_OVERLAY_FADE_IN_DURATION_MS: 250,
  LOADER_OVERLAY_EASING: "cubic-bezier(0.4, 0, 0.2, 1)",
  SKELETON_SHIMMER_DURATION_MS: 2000,
  SKELETON_BASE_COLOR: "#e5e7eb",
  SKELETON_HIGHLIGHT_COLOR: "#f3f4f6",
  PDF_FADE_IN_DURATION_MS: 400,
  PDF_FADE_IN_DELAY_MS: 100,
  PDF_FADE_IN_EASING: "cubic-bezier(0.4, 0, 0.2, 1)",
  BUTTON_HOVER_SCALE: 1.02,
  BUTTON_ACTIVE_SCALE: 0.98,
  BUTTON_TRANSITION_DURATION_MS: 150,
  BUTTON_EASING: "cubic-bezier(0.4, 0, 0.2, 1)",
  FILE_CARD_ENTER_DURATION_MS: 300,
  FILE_CARD_ENTER_DELAY_MS: 50,
  FILE_CARD_EASING: "cubic-bezier(0.4, 0, 0.2, 1)",
  FILE_CARD_SLIDE_DISTANCE_PX: 10,
  SELECT_ENTER_DURATION_MS: 250,
  SELECT_ENTER_DELAY_MS: 100,
  SELECT_EASING: "cubic-bezier(0.4, 0, 0.2, 1)",
  SELECT_HOVER_SCALE: 1.01,
  SELECT_FOCUS_SCALE: 1.02,
  LOADER_BOUNCE_DURATION_MS: 2000,
  LOADER_BOUNCE_DISTANCE_PX: 10,
  LOADER_BOUNCE_EASING: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
} as const;

export const SCENARIO = {
  EDIT: "edit",
  TAILOR: "tailor",
} as const;

export const CLASSIFICATION_CONSTANTS = {
  ENDPOINT: "/classify",
  MODE_QUERY_PARAM: "mode",
  FORM_DATA_FIELD_NAMES: {
    FILE: "file",
    JOB_TEXT: "jobText",
    RESUME_TEXT: "resumeText",
  },
} as const;

export const FILE_CONSTANTS = {
  MAX_SIZE_MB: 10,
  ACCEPTED_TYPES: ".pdf",
  DEFAULT_FILENAME: "transformed-resume.md",
  PDF_DOWNLOAD_FILENAME: "transformed-resume.pdf",
  MARKDOWN_MIME_TYPE: "text/markdown",
  PDF_MIME_TYPE: "pdf",
  BYTES_PER_KB: 1024,
  MAX_PAGES: 4,
  FILE_SIZE_DECIMAL_PLACES: 2,
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

export const VALIDATION_CONSTANTS = {
  RESUME_TEXT_MIN_LENGTH: 10,
  RESUME_TEXT_MAX_LENGTH: 10000,
  JOB_DESCRIPTION_MIN_LENGTH: 10,
  JOB_DESCRIPTION_MAX_LENGTH: 10000,
  EDIT_PROMPT_MIN_LENGTH: 10,
  EDIT_PROMPT_MAX_LENGTH: 500,
} as const;

export const TOAST_MESSAGES = {
  RESUME_GENERATED_SUCCESS: "Resume transformed successfully!",
  RESUME_EDITED_SUCCESS: "Resume edited successfully!",
  RESUME_GENERATION_FAILED: "Failed to transform resume",
  DOCUMENT_LOAD_FAILED: "Failed to load document",
  CREATING_DOCUMENT: "Creating document...",
  STARTING_RESUME_GENERATION: "Resume transformation in progress...",
  STARTING_RESUME_EDIT: "Resume editing in progress...",
  CREATE_DOCUMENT_OR_GENERATE_RESUME_FAILED:
    "Failed to create document or transform resume",
  RESUME_DOWNLOADED_SUCCESS: "Resume downloaded successfully",
  RESUME_DOWNLOAD_FAILED: "Failed to download resume",
  PARSING_ORIGINAL_RESUME: "Parsing original resume...",
  PARSE_ORIGINAL_RESUME_FAILED: "Failed to parse original resume",
  CLASSIFYING_CONTENT: "Validating content...",
  CLASSIFICATION_FAILED: "Failed to validate content",
  EDITING_RESUME: "Editing resume...",
  DOCUMENT_EXPIRED: "Document expired. Please create a new one.",
  DOCUMENT_ACCESS_DENIED: "This is not your document. Access denied.",
} as const;

export const ERROR_MESSAGES = {
  USER_NOT_AUTHENTICATED: "User not authenticated",
  FAILED_TO_DOWNLOAD_PDF: "Failed to download PDF",
} as const;

export const UI_TEXT = {
  UPLOAD_RESUME_STEP_TITLE: "Step 1: Upload Your Resume",
  UPLOAD_RESUME_STEP_DESCRIPTION:
    "Upload your current resume. We'll transform it to match any job description.",
  UPLOAD_RESUME_EDIT_STEP_DESCRIPTION:
    "Upload your resume and edit it using natural language instructions.",
  EDIT_PROMPT_TEMPLATES_PLACEHOLDER: "Quick templates...",
  UPLOAD_PDF_BUTTON: "Upload PDF",
  PASTE_TEXT_BUTTON: "Paste Text",
  RESUME_PDF_LABEL: "Resume PDF",
  RESUME_TEXT_LABEL: "Resume Text",
  RESUME_TEXT_PLACEHOLDER: "Paste your resume content here...",
  UPLOAD_FILE_TEXT: "Upload a file",
  REPLACE_FILE_TEXT: "Replace",
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
  JOB_DESCRIPTION_STEP_TITLE: "Step 2: Add Job Description",
  JOB_DESCRIPTION_STEP_DESCRIPTION:
    "Paste the job description you want to match. We'll adapt your resume to fit perfectly.",
  JOB_DESCRIPTION_LABEL: "Job Description",
  JOB_DESCRIPTION_PLACEHOLDER:
    "Paste the complete job description here. Include requirements, responsibilities, and qualifications...",
  CHARACTERS_LABEL: "characters",
  BACK_BUTTON: "Back",
  GENERATING_BUTTON: "Transforming...",
  GENERATE_TAILORED_RESUME_BUTTON: "Transform Resume",
  PREVIEW_STEP_TITLE: "Step 3: Preview & Download",
  PREVIEW_STEP_TITLE_EDIT: "Step 2: Preview & Download",
  PREVIEW_STEP_TITLE_TAILOR: "Step 3: Preview & Download",
  INITIAL_STEP_TITLE: "Upload Your Resume",
  INITIAL_STEP_DESCRIPTION:
    "Upload your resume as a PDF file or paste it as text. Then choose how you want to proceed.",
  EDIT_RESUME_BUTTON: "Custom Edit",
  TAILOR_RESUME_BUTTON: "Match Job Description",
  EDIT_INSTRUCTIONS_LABEL: "What to change",
  GENERATE_EDITED_RESUME_BUTTON: "Generate Edited Resume",
  TRANSFORMING_RESUME: "Transforming...",
  EDITING_RESUME_BUTTON: "Editing...",
  PREVIEW_STEP_DESCRIPTION:
    "Review your transformed resume and download it when ready.",
  TAILORED_RESUME_PREVIEW_LABEL: "Transformed Resume Preview",
  LOADING_TEXT: "Loading...",
  LOADING_RESUME_PDF_TEXT: "Loading resume PDF...",
  GENERATION_FAILED_PREFIX: "Generation failed:",
  UNKNOWN_ERROR_TEXT: "Unknown error",
  NO_RESUME_AVAILABLE_TEXT: "No resume available yet.",
  PDF_READY_TEXT: "Your transformed resume PDF is ready for download.",
  CLICK_DOWNLOAD_BUTTON_TEXT:
    "Click the download button below to get your PDF.",
  START_OVER_BUTTON: "Start Over",
  DOWNLOADING_TEXT: "Downloading...",
  DOWNLOAD_RESUME_BUTTON: "Download Resume",
  FILE_VALIDATION_HINT: `File must be a PDF, not exceed ${FILE_CONSTANTS.MAX_SIZE_MB}MB, and have no more than ${FILE_CONSTANTS.MAX_PAGES} pages`,
  TEXT_VALIDATION_HINT: `Text must be between ${
    VALIDATION_CONSTANTS.RESUME_TEXT_MIN_LENGTH
  } and ${VALIDATION_CONSTANTS.RESUME_TEXT_MAX_LENGTH.toLocaleString()} characters`,
  FILE_REQUIRED_ERROR: "File is required",
  FILE_SIZE_UNIT: "MB",
  REMOVE_FILE_TEXT: "Remove",
  FILE_SIZE_EXCEEDS_LIMIT_MESSAGE: (maxSizeMb: number) =>
    `File size exceeds ${maxSizeMb}MB limit`,
  FILE_MUST_BE_PDF_MESSAGE: "File must be a PDF",
  TEXT_MIN_LENGTH_MESSAGE: (minLength: number) =>
    `Text must be at least ${minLength} characters`,
  TEXT_MAX_LENGTH_MESSAGE: (maxLength: number) =>
    `Text must not exceed ${maxLength.toLocaleString()} characters`,
  INVALID_FILE_MESSAGE: "Invalid file",
  INVALID_TEXT_MESSAGE: "Invalid text",
  RESUME_PAGE_COUNT_EXCEEDS_LIMIT_MESSAGE: (
    maxPages: number,
    actualPages: number
  ) =>
    `Resume cannot exceed ${maxPages} pages. Your document has ${actualPages} pages.`,
  FAILED_TO_VALIDATE_PDF_MESSAGE: "Failed to validate PDF",
  FAILED_TO_READ_PDF_MESSAGE: "Failed to read PDF file",
  JOB_DESCRIPTION_VALIDATION_HINT: (minLength: number, maxLength: number) =>
    `Text must be between ${minLength} and ${maxLength.toLocaleString()} characters`,
  JOB_DESCRIPTION_REQUIRED_ERROR: "Job description is required",
  INVALID_JOB_DESCRIPTION_MESSAGE: "Invalid job description",
  RESUME_NOT_VALID_WARNING:
    "Please return to Step 1 and upload a valid resume before continuing.",
  RESUME_NOT_SELECTED_WARNING:
    "Please return to Step 1 and upload your resume first.",
  RESUME_VALIDATION_REQUIRED_TITLE: "Resume validation required",
  INVALID_RESUME_TITLE: "Invalid Resume",
  INVALID_JOB_DESCRIPTION_TITLE: "Invalid Job Description",
  RESUME_CLASSIFICATION_FAILED:
    "The provided text does not appear to be a resume. Please provide a valid resume with personal information, work experience, education, and skills.",
  JOB_DESCRIPTION_CLASSIFICATION_FAILED:
    "The provided text does not appear to be a job description. Please provide a valid job description with job title, responsibilities, and requirements.",
  EDIT_RESUME_MODAL_TITLE: "Edit Resume",
  EDIT_RESUME_MODAL_DESCRIPTION:
    "Describe the changes you want to make to your resume. For example: 'Change phone number to +1*** **** ***' or 'Update email address'.",
  EDIT_PROMPT_LABEL: "Edit Instructions",
  EDIT_PROMPT_PLACEHOLDER:
    "Enter your edit instructions here... (e.g., 'Change phone number to +1*** **** ***')",
  EDIT_PROMPT_REQUIRED_ERROR: "Edit instructions are required",
  EDIT_PROMPT_VALIDATION_HINT: (minLength: number, maxLength: number) =>
    `Edit instructions must be between ${minLength} and ${maxLength.toLocaleString()} characters`,
  EDIT_PROMPT_TEMPLATES: {
    CHANGE_CONTACT_INFO: "Change phone number to +1*** **** ***",
    ADD_CERTIFICATION:
      "Add certification: AWS Certified Solutions Architect (2024)",
    UPDATE_EXPERIENCE: "Update work experience: Add new project details",
  },
  APPLY_CHANGES_BUTTON: "Apply Changes",
  EDIT_AND_TRANSFORM_BUTTON: "Edit & Transform",
  CANCEL_BUTTON: "Cancel",
  EDITING_RESUME: "Editing resume...",
  PROMPT_APPLIED_SUCCESS: "Edit prompt applied successfully",
  RESUME_EDITED_SUCCESS: "Resume edited successfully",
  RESUME_EDIT_FAILED: "Failed to edit resume",
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

export const DOM_CONSTANTS = {
  ESCAPE_KEY: "Escape",
  KEYDOWN_EVENT: "keydown",
  ANCHOR_ELEMENT_TAG: "a",
  OVERFLOW_HIDDEN: "hidden",
  OVERFLOW_AUTO: "",
} as const;
