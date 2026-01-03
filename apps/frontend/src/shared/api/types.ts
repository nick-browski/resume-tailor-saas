export interface Document {
  id: string;
  ownerId: string;
  jobText: string;
  resumeText: string;
  initialOriginalResumeData: string | null;
  originalResumeData: string | null;
  originalParseStatus?: "parsing" | "parsed" | "failed" | null;
  tailoredText: string | null;
  tailoredResumeData: string | null;
  status: DocumentStatus;
  pdfOriginalPath: string;
  pdfResultPath: string | null;
  createdAt: string;
  error: string | null;
}

export interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    website?: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string | "Present";
    description: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    graduationDate: string;
  }>;
  skills: string[];
  certifications?: Array<{
    name: string;
    issuer: string;
    date?: string;
  }>;
}

export type DocumentStatus =
  | "uploaded"
  | "parsed"
  | "generating"
  | "generated"
  | "failed";

export interface CreateDocumentRequest {
  file?: File;
  resumeText?: string;
  jobText?: string;
}

export interface CreateDocumentResponse {
  id: string;
  status: DocumentStatus;
}

export interface GenerateResumeRequest {
  documentId: string;
}

export interface GenerateResumeResponse {
  status: DocumentStatus;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface ClassifyContentRequest {
  file?: File;
  resumeText?: string;
  jobText: string;
}

export interface ClassifyContentResponse {
  isResumeValid: boolean;
  isJobDescriptionValid: boolean;
  resumeReason?: string;
  jobDescriptionReason?: string;
  extractedResumeText?: string;
}

export interface EditResumeRequest {
  documentId: string;
  prompt: string;
}

export interface EditResumeResponse {
  status: DocumentStatus;
}
