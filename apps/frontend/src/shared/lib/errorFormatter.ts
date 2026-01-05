import { TOAST_MESSAGES } from "./constants";

export function formatServerError(
  error: string | Error | unknown | null | undefined
): string {
  if (error) {
    console.error("Server error:", error);
  }
  return TOAST_MESSAGES.RESUME_GENERATION_FAILED;
}
