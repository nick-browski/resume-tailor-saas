export interface Document {
  id: string;
  ownerId: string;
  jobText: string;
  resumeText: string;
  tailoredText: string | null;
  status: DocumentStatus;
  pdfOriginalPath: string;
  pdfResultPath: string | null;
  createdAt: string;
  error: string | null;
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
  documentId: string;
  status: DocumentStatus;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
