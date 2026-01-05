import { createApiClient } from "./client";
import { API_CONFIG } from "@/shared/config";
import {
  createMultipartFormData,
  appendOptionalJsonField,
} from "@/shared/lib/formDataUtils";
import type {
  Document,
  CreateDocumentRequest,
  CreateDocumentResponse,
  ResumeData,
} from "./types";

const DOCUMENTS_ENDPOINT = "/documents";

const documentsApiClient = createApiClient(API_CONFIG.documentsApi);
const generateApiClient = createApiClient(API_CONFIG.generateApi);

export const documentsApi = {
  async create(
    createRequest: CreateDocumentRequest
  ): Promise<CreateDocumentResponse> {
    if (createRequest.file) {
      const requestFormData = createMultipartFormData(
        createRequest.file,
        createRequest.resumeText,
        createRequest.jobText
      );
      appendOptionalJsonField(
        requestFormData,
        "matchCheckResult",
        createRequest.matchCheckResult
      );
      return documentsApiClient.postFormData<CreateDocumentResponse>(
        DOCUMENTS_ENDPOINT,
        requestFormData
      );
    } else {
      return documentsApiClient.post<CreateDocumentResponse>(
        DOCUMENTS_ENDPOINT,
        {
          resumeText: createRequest.resumeText,
          jobText: createRequest.jobText,
          matchCheckResult: createRequest.matchCheckResult || null,
        }
      );
    }
  },

  async getById(documentId: string): Promise<Document> {
    return documentsApiClient.get<Document>(
      `${DOCUMENTS_ENDPOINT}/${documentId}`
    );
  },

  async getAll(): Promise<Document[]> {
    return documentsApiClient.get<Document[]>(DOCUMENTS_ENDPOINT);
  },

  async downloadPDF(documentId: string): Promise<Blob> {
    const endpoint = `${DOCUMENTS_ENDPOINT}/${documentId}/pdf`;
    return documentsApiClient.get<Blob>(endpoint);
  },

  async parseOriginalResume(documentId: string): Promise<ResumeData> {
    const endpoint = `/documents/${documentId}/parse-original`;
    const data = await generateApiClient.post<{
      originalResumeData: ResumeData;
    }>(endpoint);
    return data.originalResumeData;
  },
};
