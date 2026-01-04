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
  currentResumeData: ResumeData | null;
  baselineResumeData: ResumeData | null;
} {
  return {
    tailoredResumeData: parseResumeData(documentData?.tailoredResumeData),
    currentResumeData: parseResumeData(documentData?.originalResumeData),
    baselineResumeData: parseResumeData(
      documentData?.initialOriginalResumeData
    ),
  };
}

// DIFF uses baselineResumeData, normal view uses currentResumeData
export function getOriginalResumeDataForDiff(
  showDiff: boolean,
  baselineResumeData: ResumeData | null,
  currentResumeData: ResumeData | null
): ResumeData | null {
  if (showDiff) {
    return baselineResumeData;
  }
  return currentResumeData;
}
