import { createApiClient } from "./client";
import { API_CONFIG } from "@/shared/config";
import type {
  Document,
  CreateDocumentRequest,
  CreateDocumentResponse,
} from "./types";

const DOCUMENTS_ENDPOINT = "/documents";

const documentsApiClient = createApiClient(API_CONFIG.documentsApi);

export const documentsApi = {
  async create(
    createRequest: CreateDocumentRequest
  ): Promise<CreateDocumentResponse> {
    const requestFormData = new FormData();

    if (createRequest.file) {
      requestFormData.append("file", createRequest.file);
    } else if (createRequest.resumeText) {
      requestFormData.append("resumeText", createRequest.resumeText);
    }

    if (createRequest.jobText) {
      requestFormData.append("jobText", createRequest.jobText);
    }

    return documentsApiClient.postFormData<CreateDocumentResponse>(
      DOCUMENTS_ENDPOINT,
      requestFormData
    );
  },

  async getById(documentId: string): Promise<Document> {
    return documentsApiClient.get<Document>(
      `${DOCUMENTS_ENDPOINT}/${documentId}`
    );
  },

  async getAll(): Promise<Document[]> {
    return documentsApiClient.get<Document[]>(DOCUMENTS_ENDPOINT);
  },
};
