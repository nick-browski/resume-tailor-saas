import {
  MISTRAL_CONFIG,
  MISTRAL_MESSAGE_ROLES,
  MATCH_CHECK_CONFIG,
} from "../config/constants.js";
import { callMistralAPI, type MistralMessage } from "../utils/mistralClient.js";
import { extractJsonFromResponse } from "../utils/jsonUtils.js";
import { safeJsonParse } from "../utils/jsonUtils.js";
import {
  MATCH_CHECK_PROMPT_TEMPLATE,
  MATCH_CHECK_PROMPT_PLACEHOLDERS,
} from "../prompts/index.js";

interface MatchAnalysisResponse {
  isMatch: boolean;
  matchScore: number;
  reasons?: string[];
  missingSkills?: string[];
  matchingSkills?: string[];
  confidence: number;
}

export interface MatchResult {
  isMatch: boolean;
  matchScore: number;
  reasons?: string[];
  missingSkills?: string[];
  matchingSkills?: string[];
}

export async function checkResumeJobMatch(
  resumeText: string,
  jobDescriptionText: string
): Promise<MatchResult> {
  const truncatedResumeText = resumeText.substring(
    0,
    MISTRAL_CONFIG.CLASSIFICATION_MAX_TEXT_LENGTH
  );
  const truncatedJobDescriptionText = jobDescriptionText.substring(
    0,
    MISTRAL_CONFIG.CLASSIFICATION_MAX_TEXT_LENGTH
  );

  const formattedPrompt = MATCH_CHECK_PROMPT_TEMPLATE.replace(
    MATCH_CHECK_PROMPT_PLACEHOLDERS.RESUME_TEXT,
    truncatedResumeText
  ).replace(
    MATCH_CHECK_PROMPT_PLACEHOLDERS.JOB_TEXT,
    truncatedJobDescriptionText
  );

  const mistralRequestMessages: MistralMessage[] = [
    { role: MISTRAL_MESSAGE_ROLES.USER, content: formattedPrompt },
  ];

  try {
    const mistralApiResponse = await callMistralAPI(
      mistralRequestMessages,
      MISTRAL_CONFIG.CLASSIFICATION_MAX_TOKENS
    );
    const responseMessageContent =
      mistralApiResponse.choices[0].message.content;
    const extractedJsonString = extractJsonFromResponse(responseMessageContent);
    const parsedMatchAnalysisResponse = safeJsonParse<MatchAnalysisResponse>(
      extractedJsonString,
      "Failed to parse match check response"
    );

    const isMatchResultValid =
      typeof parsedMatchAnalysisResponse.isMatch === "boolean" &&
      typeof parsedMatchAnalysisResponse.matchScore === "number" &&
      parsedMatchAnalysisResponse.matchScore >= 0 &&
      parsedMatchAnalysisResponse.matchScore <= 1 &&
      parsedMatchAnalysisResponse.confidence >
        MISTRAL_CONFIG.MINIMUM_CONFIDENCE_THRESHOLD;

    if (!isMatchResultValid) {
      return {
        isMatch: false,
        matchScore: 0,
        reasons: [MATCH_CHECK_CONFIG.ERROR_MESSAGE_ANALYSIS_FAILED],
      };
    }

    return {
      isMatch: parsedMatchAnalysisResponse.isMatch,
      matchScore: parsedMatchAnalysisResponse.matchScore,
      reasons: parsedMatchAnalysisResponse.reasons || [],
      missingSkills: parsedMatchAnalysisResponse.missingSkills || [],
      matchingSkills: parsedMatchAnalysisResponse.matchingSkills || [],
    };
  } catch (matchAnalysisError) {
    console.error("Failed to parse match check JSON:", matchAnalysisError);
    return {
      isMatch: false,
      matchScore: 0,
      reasons: [MATCH_CHECK_CONFIG.ERROR_MESSAGE_COMPATIBILITY_FAILED],
    };
  }
}
