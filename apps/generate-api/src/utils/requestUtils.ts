import { extractTextFromPdfBuffer } from "./pdfUtils.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

export async function extractResumeTextFromRequest(
  request: AuthenticatedRequest
): Promise<string> {
  const uploadedFile = request.file;
  const resumeTextFromRequestBody = request.body.resumeText;

  if (uploadedFile) {
    return await extractTextFromPdfBuffer(uploadedFile.buffer);
  }

  return resumeTextFromRequestBody!;
}

export function createResponseWithExtractedText<
  T extends { extractedResumeText?: string }
>(
  responseData: Omit<T, "extractedResumeText">,
  extractedResumeText: string | undefined,
  wasFileUploaded: boolean
): T {
  return {
    ...responseData,
    extractedResumeText: wasFileUploaded ? extractedResumeText : undefined,
  } as T;
}
