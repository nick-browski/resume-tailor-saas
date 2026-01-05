import type { MatchCheckResult } from "../types/document.js";
import { matchCheckResultSchema } from "../schemas/common.js";

export function parseMatchCheckResult(
  matchCheckResultFromRequestBody: unknown
): MatchCheckResult | null {
  if (!matchCheckResultFromRequestBody) {
    return null;
  }

  const validationResult = matchCheckResultSchema.safeParse(
    matchCheckResultFromRequestBody
  );

  if (
    !validationResult.success ||
    !validationResult.data ||
    validationResult.data === null
  ) {
    if (validationResult.error) {
      console.error(
        "Failed to validate matchCheckResult:",
        validationResult.error
      );
    }
    return null;
  }

  return validationResult.data;
}
