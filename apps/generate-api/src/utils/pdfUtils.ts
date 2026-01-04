// @ts-expect-error - pdf-parse doesn't have type definitions
import pdfParse from "pdf-parse";

// Extracts text from PDF buffer
export async function extractTextFromPdfBuffer(
  pdfBuffer: Buffer
): Promise<string> {
  const parsedPdfResult = await pdfParse(pdfBuffer);
  return parsedPdfResult.text;
}

