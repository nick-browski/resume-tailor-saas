import { z } from "zod";
import { VALIDATION_CONSTANTS, UI_TEXT } from "@/shared/lib/constants";

export const editPromptSchema = z
  .string()
  .min(VALIDATION_CONSTANTS.EDIT_PROMPT_MIN_LENGTH, {
    message: UI_TEXT.TEXT_MIN_LENGTH_MESSAGE(
      VALIDATION_CONSTANTS.EDIT_PROMPT_MIN_LENGTH
    ),
  })
  .max(VALIDATION_CONSTANTS.EDIT_PROMPT_MAX_LENGTH, {
    message: UI_TEXT.TEXT_MAX_LENGTH_MESSAGE(
      VALIDATION_CONSTANTS.EDIT_PROMPT_MAX_LENGTH
    ),
  })
  .trim();

export function validateEditPrompt(editPromptToValidate: string): {
  success: boolean;
  error?: string;
} {
  if (!editPromptToValidate.trim()) {
    return {
      success: false,
      error: UI_TEXT.EDIT_PROMPT_REQUIRED_ERROR,
    };
  }
  const validationResult = editPromptSchema.safeParse(editPromptToValidate);
  if (!validationResult.success) {
    return {
      success: false,
      error:
        validationResult.error.issues[0]?.message ||
        UI_TEXT.EDIT_PROMPT_REQUIRED_ERROR,
    };
  }
  return { success: true };
}

