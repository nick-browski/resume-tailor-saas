import { ERROR_MESSAGES } from "../config/constants.js";

// Safely parses a JSON string with proper error handling
export function safeJsonParse<T>(
  jsonString: string | undefined | null,
  errorMessage: string = ERROR_MESSAGES.FAILED_TO_PARSE_EXISTING_RESUME_DATA
): T {
  if (!jsonString || typeof jsonString !== "string") {
    throw new Error(errorMessage);
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (parsingError) {
    const errorDetails =
      parsingError instanceof Error
        ? parsingError.message
        : ERROR_MESSAGES.UNKNOWN_ERROR;
    throw new Error(`${errorMessage}: ${errorDetails}`);
  }
}
