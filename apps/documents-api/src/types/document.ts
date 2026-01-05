export type DocumentStatus =
  | "uploaded"
  | "parsed"
  | "generating"
  | "generated"
  | "failed";

export interface MatchCheckResult {
  isMatch: boolean;
  matchScore: number;
  reasons?: string[];
  missingSkills?: string[];
  matchingSkills?: string[];
}

export interface Document {
  id: string;
  ownerId: string;
  jobText: string;
  resumeText: string;
  initialOriginalResumeData: string | null;
  originalResumeData: string | null;
  tailoredText: string | null;
  tailoredResumeData: string | null;
  status: DocumentStatus;
  pdfOriginalPath: string;
  pdfResultPath: string | null;
  createdAt: string;
  error: string | null;
  matchCheckResult?: MatchCheckResult | null;
}

