import { IS_CLOUD_RUN } from "./constants.js";

// Normalize: remove trailing slash to avoid audience mismatch
const SERVICE_URL_RAW =
  process.env.SERVICE_URL || process.env.GENERATE_API_URL || "";
export const SERVICE_URL = SERVICE_URL_RAW.replace(/\/+$/, "");

const DEFAULT_PROJECT_ID = "resume-tailor-saas";
const DEFAULT_CLOUD_TASKS_LOCATION = "us-central1";
const DEFAULT_CLOUD_TASKS_QUEUE_NAME = "resume-generation";

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || DEFAULT_PROJECT_ID;

// In production (Cloud Run), require explicit CLOUD_TASKS_SERVICE_ACCOUNT
// Fallback only in dev (should not be used in prod)
if (IS_CLOUD_RUN && !process.env.CLOUD_TASKS_SERVICE_ACCOUNT) {
  throw new Error(
    "CLOUD_TASKS_SERVICE_ACCOUNT environment variable is required in production. " +
      "Set it to the service account email that Cloud Tasks will use for OIDC authentication."
  );
}

// Fallback for dev only (should use explicit SA in prod via env var)
export const CLOUD_TASKS_SERVICE_ACCOUNT =
  process.env.CLOUD_TASKS_SERVICE_ACCOUNT ||
  `${PROJECT_ID}@${PROJECT_ID}.iam.gserviceaccount.com`;

export const CLOUD_TASKS_CONFIG = {
  PROJECT_ID,
  LOCATION: process.env.CLOUD_TASKS_LOCATION || DEFAULT_CLOUD_TASKS_LOCATION,
  QUEUE_NAME:
    process.env.CLOUD_TASKS_QUEUE_NAME || DEFAULT_CLOUD_TASKS_QUEUE_NAME,
} as const;
