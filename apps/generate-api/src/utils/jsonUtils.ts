import {
  ERROR_MESSAGES,
  JSON_EXTRACTION_PATTERNS,
} from "../config/constants.js";

const EMPTY_STRING = "";
const STRING_TYPE = "string";
const NOT_FOUND_INDEX = -1;

// Safely parses a JSON string with proper error handling
export function safeJsonParse<T>(
  jsonString: string | undefined | null,
  errorMessage: string = ERROR_MESSAGES.FAILED_TO_PARSE_EXISTING_RESUME_DATA
): T {
  if (!jsonString || typeof jsonString !== STRING_TYPE) {
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

// Extracts JSON object from text that may contain markdown or extra content
export function extractJsonFromResponse(responseText: string): string {
  let cleanedResponseText = responseText.trim();
  cleanedResponseText = cleanedResponseText.replace(
    JSON_EXTRACTION_PATTERNS.MARKDOWN_JSON_START,
    EMPTY_STRING
  );
  cleanedResponseText = cleanedResponseText.replace(
    JSON_EXTRACTION_PATTERNS.MARKDOWN_CODE_START,
    EMPTY_STRING
  );
  cleanedResponseText = cleanedResponseText.replace(
    JSON_EXTRACTION_PATTERNS.MARKDOWN_CODE_END,
    EMPTY_STRING
  );

  const jsonStartIndex = cleanedResponseText.indexOf(
    JSON_EXTRACTION_PATTERNS.JSON_START_CHARACTER
  );

  if (jsonStartIndex === NOT_FOUND_INDEX) {
    return cleanedResponseText;
  }

  // Try parsing JSON starting from the first '{', checking at each '}' position
  for (
    let currentCharacterIndex = jsonStartIndex + 1;
    currentCharacterIndex < cleanedResponseText.length;
    currentCharacterIndex++
  ) {
    if (
      cleanedResponseText[currentCharacterIndex] ===
      JSON_EXTRACTION_PATTERNS.JSON_END_CHARACTER
    ) {
      const potentialJsonString = cleanedResponseText.substring(
        jsonStartIndex,
        currentCharacterIndex + 1
      );
      try {
        JSON.parse(potentialJsonString);
        return potentialJsonString;
      } catch {
        // Continue searching for next '}'
      }
    }
  }

  return cleanedResponseText;
}
