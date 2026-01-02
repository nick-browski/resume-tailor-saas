import { createApiClient } from "./client";
import { API_CONFIG } from "@/shared/config";
import { auth } from "@/shared/config";
import { ERROR_MESSAGES } from "@/shared/lib/constants";
import type {
  Document,
  CreateDocumentRequest,
  CreateDocumentResponse,
  ResumeData,
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

  async downloadPDF(documentId: string): Promise<Blob> {
    const authenticatedUser = auth.currentUser;
    if (!authenticatedUser) {
      throw new Error(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
    }

    const authenticationToken = await authenticatedUser.getIdToken();
    const pdfDownloadResponse = await fetch(
      `${API_CONFIG.documentsApi}${DOCUMENTS_ENDPOINT}/${documentId}/pdf`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authenticationToken}`,
        },
      }
    );

    if (!pdfDownloadResponse.ok) {
      throw new Error(ERROR_MESSAGES.FAILED_TO_DOWNLOAD_PDF);
    }

    return pdfDownloadResponse.blob();
  },

  async parseOriginalResume(documentId: string): Promise<ResumeData> {
    const authenticatedUser = auth.currentUser;
    if (!authenticatedUser) {
      throw new Error(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
    }

    const authenticationToken = await authenticatedUser.getIdToken();
    const parseResponse = await fetch(
      `${API_CONFIG.generateApi}/documents/${documentId}/parse-original`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authenticationToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      throw new Error(`Failed to parse original resume: ${errorText}`);
    }

    const data = await parseResponse.json();
    return data.originalResumeData;
  },
};
