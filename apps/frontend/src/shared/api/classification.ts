import { createApiClient } from "./client";
import { API_CONFIG } from "@/shared/config";
import { SCENARIO, CLASSIFICATION_CONSTANTS } from "@/shared/lib/constants";
import type { ClassifyContentRequest, ClassifyContentResponse } from "./types";

const classificationApiClient = createApiClient(API_CONFIG.generateApi);

export const classificationApi = {
  async classify(
    classifyRequest: ClassifyContentRequest,
    classificationMode?: "edit" | "tailor"
  ): Promise<ClassifyContentResponse> {
    const classifyEndpoint = classificationMode
      ? `${CLASSIFICATION_CONSTANTS.ENDPOINT}?${CLASSIFICATION_CONSTANTS.MODE_QUERY_PARAM}=${classificationMode}`
      : CLASSIFICATION_CONSTANTS.ENDPOINT;

    if (classifyRequest.file) {
      const multipartFormData = new FormData();
      multipartFormData.append(
        CLASSIFICATION_CONSTANTS.FORM_DATA_FIELD_NAMES.FILE,
        classifyRequest.file
      );
      if (classificationMode !== SCENARIO.EDIT && classifyRequest.jobText) {
        multipartFormData.append(
          CLASSIFICATION_CONSTANTS.FORM_DATA_FIELD_NAMES.JOB_TEXT,
          classifyRequest.jobText
        );
      }
      return classificationApiClient.postFormData<ClassifyContentResponse>(
        classifyEndpoint,
        multipartFormData
      );
    }

    const jsonRequestBody: { resumeText?: string; jobText?: string } = {
      resumeText: classifyRequest.resumeText,
    };
    if (classificationMode !== SCENARIO.EDIT && classifyRequest.jobText) {
      jsonRequestBody.jobText = classifyRequest.jobText;
    }
    return classificationApiClient.post<ClassifyContentResponse>(
      classifyEndpoint,
      jsonRequestBody
    );
  },
};
