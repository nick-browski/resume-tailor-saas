import { createApiClient } from "./client";
import { API_CONFIG } from "@/shared/config";
import type { GenerateResumeRequest, GenerateResumeResponse } from "./types";

const generateApiClient = createApiClient(API_CONFIG.generateApi);

export const generateApi = {
  async generate(
    generateRequest: GenerateResumeRequest
  ): Promise<GenerateResumeResponse> {
    const generateEndpoint = `/documents/${generateRequest.documentId}/generate`;
    return generateApiClient.post<GenerateResumeResponse>(generateEndpoint, {});
  },
};
