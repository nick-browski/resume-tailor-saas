import {
  ERROR_MESSAGES,
  MISTRAL_CONFIG,
  MISTRAL_MESSAGE_ROLES,
} from "../config/constants.js";
import { callMistralAPI, type MistralMessage } from "../utils/mistralClient.js";
import { extractJsonFromResponse } from "../utils/jsonUtils.js";
import { safeJsonParse } from "../utils/jsonUtils.js";
import {
  RESUME_CLASSIFICATION_PROMPT,
  RESUME_CLASSIFICATION_PROMPT_FOR_EDIT,
  JOB_DESCRIPTION_CLASSIFICATION_PROMPT,
  CLASSIFICATION_PROMPT_PLACEHOLDERS,
} from "../prompts/index.js";

interface ClassificationResponse {
  isResume?: boolean;
  isJobDescription?: boolean;
  confidence: number;
  reason: string;
}

export enum ClassificationMode {
  EDIT = "edit",
  TAILOR = "tailor",
}

async function classifyTextWithPrompt(
  textToClassify: string,
  classificationPromptTemplate: string
): Promise<{ isValid: boolean; reason?: string }> {
  if (!textToClassify || !textToClassify.trim()) {
    return {
      isValid: false,
      reason: ERROR_MESSAGES.RESUME_TEXT_EMPTY,
    };
  }

  const truncatedText = textToClassify.substring(
    0,
    MISTRAL_CONFIG.CLASSIFICATION_MAX_TEXT_LENGTH
  );
  const formattedPrompt = classificationPromptTemplate.replace(
    CLASSIFICATION_PROMPT_PLACEHOLDERS.TEXT,
    truncatedText
  );
  const mistralMessages: MistralMessage[] = [
    { role: MISTRAL_MESSAGE_ROLES.USER, content: formattedPrompt },
  ];

  try {
    const mistralApiResponse = await callMistralAPI(
      mistralMessages,
      MISTRAL_CONFIG.CLASSIFICATION_MAX_TOKENS
    );
    const responseContent = mistralApiResponse.choices[0].message.content;
    const extractedJsonString = extractJsonFromResponse(responseContent);
    const classificationResult = safeJsonParse<ClassificationResponse>(
      extractedJsonString,
      "Failed to parse classification response"
    );

    const isValid = Boolean(
      (classificationResult.isResume ||
        classificationResult.isJobDescription) &&
        classificationResult.confidence >
          MISTRAL_CONFIG.MINIMUM_CONFIDENCE_THRESHOLD
    );

    return {
      isValid,
      reason: isValid ? undefined : classificationResult.reason,
    };
  } catch (classificationError) {
    console.error("Failed to parse classification JSON:", classificationError);
    return {
      isValid: false,
      reason: ERROR_MESSAGES.FAILED_TO_ANALYZE_RESUME_CONTENT,
    };
  }
}

export interface ClassificationResult {
  isResumeValid: boolean;
  isJobDescriptionValid: boolean;
  resumeReason?: string;
  jobDescriptionReason?: string;
  extractedResumeText?: string;
}

export async function classifyResume(
  resumeText: string,
  useEditPrompt: boolean = false
): Promise<{ isValid: boolean; reason?: string }> {
  const classificationPromptTemplate = useEditPrompt
    ? RESUME_CLASSIFICATION_PROMPT_FOR_EDIT
    : RESUME_CLASSIFICATION_PROMPT;

  try {
    return await classifyTextWithPrompt(
      resumeText,
      classificationPromptTemplate
    );
  } catch (classificationError) {
    console.error("Error classifying resume:", classificationError);
    const errorMessage =
      classificationError instanceof Error
        ? classificationError.message
        : ERROR_MESSAGES.UNKNOWN_ERROR;
    throw new Error(`Failed to classify resume: ${errorMessage}`);
  }
}

export async function classifyJobDescription(
  jobDescriptionText: string
): Promise<{ isValid: boolean; reason?: string }> {
  if (!jobDescriptionText || !jobDescriptionText.trim()) {
    return {
      isValid: false,
      reason: ERROR_MESSAGES.JOB_DESCRIPTION_TEXT_EMPTY,
    };
  }

  try {
    return await classifyTextWithPrompt(
      jobDescriptionText,
      JOB_DESCRIPTION_CLASSIFICATION_PROMPT
    );
  } catch (classificationError) {
    console.error("Error classifying job description:", classificationError);
    const errorMessage =
      classificationError instanceof Error
        ? classificationError.message
        : ERROR_MESSAGES.UNKNOWN_ERROR;
    throw new Error(`Failed to classify job description: ${errorMessage}`);
  }
}

export async function classifyContent(
  resumeText: string,
  jobDescriptionText: string,
  mode: ClassificationMode = ClassificationMode.TAILOR
): Promise<ClassificationResult> {
  if (mode === ClassificationMode.EDIT) {
    const resumeClassification = await classifyResume(resumeText, true);
    return {
      isResumeValid: resumeClassification.isValid,
      isJobDescriptionValid: true,
      resumeReason: resumeClassification.reason,
    };
  }

  const [resumeClassification, jobDescriptionClassification] =
    await Promise.all([
      classifyResume(resumeText, false),
      classifyJobDescription(jobDescriptionText),
    ]);

  return {
    isResumeValid: resumeClassification.isValid,
    isJobDescriptionValid: jobDescriptionClassification.isValid,
    resumeReason: resumeClassification.reason,
    jobDescriptionReason: jobDescriptionClassification.reason,
  };
}
