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
} as const;

export const TIMING_CONSTANTS = {
  UPLOAD_DELAY_MS: 500,
  GENERATION_DELAY_MS: 1000,
  DOWNLOAD_DELAY_MS: 500,
} as const;

export const QUERY_CONSTANTS = {
  STALE_TIME_MS: 5 * 60 * 1000,
  RETRY_COUNT: 1,
} as const;

export const TEXTAREA_CONSTANTS = {
  RESUME_ROWS: 10,
  JOB_DESCRIPTION_ROWS: 12,
} as const;
