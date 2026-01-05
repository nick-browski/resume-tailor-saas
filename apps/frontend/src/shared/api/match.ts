import { createApiClient } from "./client";
import { API_CONFIG } from "@/shared/config";
import { MATCH_CONSTANTS } from "@/shared/lib/constants";
import { createMultipartFormData } from "@/shared/lib/formDataUtils";
import type { MatchCheckRequest, MatchCheckResponse } from "./types";

const matchApiClient = createApiClient(API_CONFIG.generateApi);

export const matchApi = {
  async match(
    matchCheckRequest: MatchCheckRequest
  ): Promise<MatchCheckResponse> {
    const matchCheckEndpoint = MATCH_CONSTANTS.ENDPOINT;

    if (matchCheckRequest.file) {
      const multipartFormData = createMultipartFormData(
        matchCheckRequest.file,
        matchCheckRequest.resumeText,
        matchCheckRequest.jobText,
        {
          file: MATCH_CONSTANTS.FORM_DATA_FIELD_NAMES.FILE,
          resumeText: MATCH_CONSTANTS.FORM_DATA_FIELD_NAMES.RESUME_TEXT,
          jobText: MATCH_CONSTANTS.FORM_DATA_FIELD_NAMES.JOB_TEXT,
        }
      );
      return matchApiClient.postFormData<MatchCheckResponse>(
        matchCheckEndpoint,
        multipartFormData
      );
    }

    const jsonRequestBody: { resumeText?: string; jobText: string } = {
      jobText: matchCheckRequest.jobText,
    };
    if (matchCheckRequest.resumeText) {
      jsonRequestBody.resumeText = matchCheckRequest.resumeText;
    }
    return matchApiClient.post<MatchCheckResponse>(
      matchCheckEndpoint,
      jsonRequestBody
    );
  },
};
