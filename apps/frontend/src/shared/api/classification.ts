import { createApiClient } from "./client";
import { API_CONFIG } from "@/shared/config";
import type {
  ClassifyContentRequest,
  ClassifyContentResponse,
} from "./types";

const classificationApiClient = createApiClient(API_CONFIG.generateApi);

export const classificationApi = {
  async classify(
    request: ClassifyContentRequest
  ): Promise<ClassifyContentResponse> {
    if (request.file) {
      const requestFormData = new FormData();
      requestFormData.append("file", request.file);
      requestFormData.append("jobText", request.jobText);
      if (request.resumeText) {
        requestFormData.append("resumeText", request.resumeText);
      }
      return classificationApiClient.postFormData<ClassifyContentResponse>(
        "/classify",
        requestFormData
      );
    } else {
      return classificationApiClient.post<ClassifyContentResponse>(
        "/classify",
        {
          resumeText: request.resumeText,
          jobText: request.jobText,
        }
      );
    }
  },
};

