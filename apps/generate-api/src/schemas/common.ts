import { z } from "zod";

export const VALIDATION_LIMITS = {
  RESUME_TEXT_MIN_LENGTH: 10,
  RESUME_TEXT_MAX_LENGTH: 10000,
  JOB_TEXT_MIN_LENGTH: 10,
  JOB_TEXT_MAX_LENGTH: 10000,
  FILE_MAX_SIZE_MB: 10,
  FILE_MAX_SIZE_BYTES: 10 * 1024 * 1024,
} as const;

export const PDF_MIME_TYPE = "application/pdf";

export const firestoreIdSchema = z
  .string()
  .min(1, "ID cannot be empty")
  .max(1500, "ID is too long")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "ID can only contain letters, numbers, hyphens, and underscores"
  );

export const resumeTextSchema = z
  .string()
  .min(
    VALIDATION_LIMITS.RESUME_TEXT_MIN_LENGTH,
    `Resume text must be at least ${VALIDATION_LIMITS.RESUME_TEXT_MIN_LENGTH} characters`
  )
  .max(
    VALIDATION_LIMITS.RESUME_TEXT_MAX_LENGTH,
    `Resume text must not exceed ${VALIDATION_LIMITS.RESUME_TEXT_MAX_LENGTH.toLocaleString()} characters`
  )
  .refine((text) => text.trim().length > 0, {
    message: "Resume text cannot be empty or only whitespace",
  });

export const jobTextSchema = z
  .string()
  .min(
    VALIDATION_LIMITS.JOB_TEXT_MIN_LENGTH,
    `Job description must be at least ${VALIDATION_LIMITS.JOB_TEXT_MIN_LENGTH} characters`
  )
  .max(
    VALIDATION_LIMITS.JOB_TEXT_MAX_LENGTH,
    `Job description must not exceed ${VALIDATION_LIMITS.JOB_TEXT_MAX_LENGTH.toLocaleString()} characters`
  )
  .refine((text) => text.trim().length > 0, {
    message: "Job description cannot be empty or only whitespace",
  });

