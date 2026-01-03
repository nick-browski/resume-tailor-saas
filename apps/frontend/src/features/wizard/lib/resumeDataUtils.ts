import type { ResumeData } from "@/shared/api/types";
import type { Document } from "@/shared/api/types";

export function parseResumeData(
  resumeDataString: string | null | undefined
): ResumeData | null {
  if (!resumeDataString) return null;
  try {
    return JSON.parse(resumeDataString);
  } catch {
    return null;
  }
}

export function getResumeDataFromDocument(documentData: Document | null): {
  tailoredResumeData: ResumeData | null;
  originalResumeData: ResumeData | null;
  initialOriginalResumeData: ResumeData | null;
} {
  return {
    tailoredResumeData: parseResumeData(documentData?.tailoredResumeData),
    originalResumeData: parseResumeData(documentData?.originalResumeData),
    initialOriginalResumeData: parseResumeData(
      documentData?.initialOriginalResumeData
    ),
  };
}

export function getOriginalResumeDataForDiff(
  showDiff: boolean,
  initialOriginalResumeData: ResumeData | null,
  originalResumeData: ResumeData | null
): ResumeData | null {
  if (showDiff && initialOriginalResumeData) {
    return initialOriginalResumeData;
  }
  return originalResumeData;
}
