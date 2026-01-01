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
    if (createRequest.file) {
      const requestFormData = new FormData();
      requestFormData.append("file", createRequest.file);
      if (createRequest.jobText) {
        requestFormData.append("jobText", createRequest.jobText);
      }
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
};
