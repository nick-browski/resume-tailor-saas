import { createApiClient } from "./client";
import { API_CONFIG } from "@/shared/config";
import type { GenerateResumeRequest, GenerateResumeResponse } from "./types";

const client = createApiClient(API_CONFIG.generateApi);

export const generateApi = {
  async generate(
    request: GenerateResumeRequest
  ): Promise<GenerateResumeResponse> {
    return client.post<GenerateResumeResponse>(
      `/documents/${request.documentId}/generate`,
      {}
    );
  },
};
