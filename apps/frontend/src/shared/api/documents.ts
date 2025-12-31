import { createApiClient } from "./client";
import { API_CONFIG } from "@/shared/config";
import type {
  Document,
  CreateDocumentRequest,
  CreateDocumentResponse,
} from "./types";

const client = createApiClient(API_CONFIG.documentsApi);

export const documentsApi = {
  async create(
    request: CreateDocumentRequest
  ): Promise<CreateDocumentResponse> {
    const formData = new FormData();

    if (request.file) {
      formData.append("file", request.file);
    } else if (request.resumeText) {
      formData.append("resumeText", request.resumeText);
    }

    if (request.jobText) {
      formData.append("jobText", request.jobText);
    }

    return client.postFormData<CreateDocumentResponse>("/documents", formData);
  },

  async getById(id: string): Promise<Document> {
    return client.get<Document>(`/documents/${id}`);
  },

  async getAll(): Promise<Document[]> {
    return client.get<Document[]>("/documents");
  },
};
