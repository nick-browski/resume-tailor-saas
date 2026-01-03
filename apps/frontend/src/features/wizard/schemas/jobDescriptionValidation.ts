import { z } from "zod";
import { VALIDATION_CONSTANTS, UI_TEXT } from "@/shared/lib/constants";

export const jobDescriptionSchema = z
  .string()
  .min(VALIDATION_CONSTANTS.JOB_DESCRIPTION_MIN_LENGTH, {
    message: UI_TEXT.TEXT_MIN_LENGTH_MESSAGE(
      VALIDATION_CONSTANTS.JOB_DESCRIPTION_MIN_LENGTH
    ),
  })
  .max(VALIDATION_CONSTANTS.JOB_DESCRIPTION_MAX_LENGTH, {
    message: UI_TEXT.TEXT_MAX_LENGTH_MESSAGE(
      VALIDATION_CONSTANTS.JOB_DESCRIPTION_MAX_LENGTH
    ),
  })
  .trim();

export function validateJobDescription(jobDescriptionTextToValidate: string): {
  success: boolean;
  error?: string;
} {
  if (!jobDescriptionTextToValidate.trim()) {
    return {
      success: false,
      error: UI_TEXT.TEXT_MIN_LENGTH_MESSAGE(
        VALIDATION_CONSTANTS.JOB_DESCRIPTION_MIN_LENGTH
      ),
    };
  }
  const validationResult = jobDescriptionSchema.safeParse(
    jobDescriptionTextToValidate
  );
  if (!validationResult.success) {
    return {
      success: false,
      error:
        validationResult.error.issues[0]?.message ||
        UI_TEXT.INVALID_JOB_DESCRIPTION_MESSAGE,
    };
  }
  return { success: true };
}
