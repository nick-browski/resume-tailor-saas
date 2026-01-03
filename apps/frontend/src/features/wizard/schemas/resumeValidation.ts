import { z } from "zod";
import {
  FILE_CONSTANTS,
  VALIDATION_CONSTANTS,
  UI_TEXT,
} from "@/shared/lib/constants";
import { getPdfPageCount } from "../lib/pdfUtils";

export const fileSchema = z
  .instanceof(File, { message: UI_TEXT.FILE_REQUIRED_ERROR })
  .refine(
    (fileToCheck: File) =>
      fileToCheck.size <=
      FILE_CONSTANTS.MAX_SIZE_MB *
        FILE_CONSTANTS.BYTES_PER_KB *
        FILE_CONSTANTS.BYTES_PER_KB,
    {
      message: UI_TEXT.FILE_SIZE_EXCEEDS_LIMIT_MESSAGE(
        FILE_CONSTANTS.MAX_SIZE_MB
      ),
    }
  )
  .refine(
    (fileToCheck: File) =>
      fileToCheck.type.includes(FILE_CONSTANTS.PDF_MIME_TYPE) ||
      fileToCheck.name.toLowerCase().endsWith(".pdf"),
    {
      message: UI_TEXT.FILE_MUST_BE_PDF_MESSAGE,
    }
  );

export const resumeTextSchema = z
  .string()
  .min(VALIDATION_CONSTANTS.RESUME_TEXT_MIN_LENGTH, {
    message: UI_TEXT.TEXT_MIN_LENGTH_MESSAGE(
      VALIDATION_CONSTANTS.RESUME_TEXT_MIN_LENGTH
    ),
  })
  .max(VALIDATION_CONSTANTS.RESUME_TEXT_MAX_LENGTH, {
    message: UI_TEXT.TEXT_MAX_LENGTH_MESSAGE(
      VALIDATION_CONSTANTS.RESUME_TEXT_MAX_LENGTH
    ),
  })
  .trim();

export async function validateFile(
  fileToValidate: File
): Promise<{ success: boolean; error?: string }> {
  const validationResult = fileSchema.safeParse(fileToValidate);
  if (!validationResult.success) {
    return {
      success: false,
      error:
        validationResult.error.issues[0]?.message ||
        UI_TEXT.INVALID_FILE_MESSAGE,
    };
  }

  try {
    const pdfPageCount = await getPdfPageCount(fileToValidate);
    if (pdfPageCount > FILE_CONSTANTS.MAX_PAGES) {
      return {
        success: false,
        error: UI_TEXT.RESUME_PAGE_COUNT_EXCEEDS_LIMIT_MESSAGE(
          FILE_CONSTANTS.MAX_PAGES,
          pdfPageCount
        ),
      };
    }
  } catch (pdfValidationError) {
    return {
      success: false,
      error:
        pdfValidationError instanceof Error
          ? pdfValidationError.message
          : UI_TEXT.FAILED_TO_VALIDATE_PDF_MESSAGE,
    };
  }

  return { success: true };
}

export function validateResumeText(resumeTextToValidate: string): {
  success: boolean;
  error?: string;
} {
  if (!resumeTextToValidate.trim()) {
    return {
      success: false,
      error: UI_TEXT.TEXT_MIN_LENGTH_MESSAGE(
        VALIDATION_CONSTANTS.RESUME_TEXT_MIN_LENGTH
      ),
    };
  }
  const validationResult = resumeTextSchema.safeParse(resumeTextToValidate);
  if (!validationResult.success) {
    return {
      success: false,
      error:
        validationResult.error.issues[0]?.message ||
        UI_TEXT.INVALID_TEXT_MESSAGE,
    };
  }
  return { success: true };
}
