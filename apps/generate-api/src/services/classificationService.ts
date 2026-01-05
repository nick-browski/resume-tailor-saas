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
  EDIT_REQUEST_VALIDATION_PROMPT,
  CLASSIFICATION_PROMPT_PLACEHOLDERS,
} from "../prompts/index.js";

interface ClassificationResponse {
  isResume?: boolean;
  isJobDescription?: boolean;
  confidence: number;
  reason: string;
}

interface EditRequestValidationResponse {
  isValid: boolean;
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
  isJobDescriptionValid?: boolean;
  resumeReason?: string;
  jobDescriptionReason?: string;
  extractedResumeText?: string;
  isEditRequestValid?: boolean;
  editRequestReason?: string;
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

export async function validateEditRequest(
  editRequestText: string
): Promise<{ isValid: boolean; reason?: string }> {
  if (!editRequestText || !editRequestText.trim()) {
    return {
      isValid: false,
      reason: ERROR_MESSAGES.EDIT_PROMPT_EMPTY,
    };
  }

  const truncatedEditRequestText = editRequestText.substring(
    0,
    MISTRAL_CONFIG.CLASSIFICATION_MAX_TEXT_LENGTH
  );
  const formattedValidationPrompt = EDIT_REQUEST_VALIDATION_PROMPT.replace(
    CLASSIFICATION_PROMPT_PLACEHOLDERS.TEXT,
    truncatedEditRequestText
  );
  const mistralMessages: MistralMessage[] = [
    { role: MISTRAL_MESSAGE_ROLES.USER, content: formattedValidationPrompt },
  ];

  try {
    const mistralApiResponse = await callMistralAPI(
      mistralMessages,
      MISTRAL_CONFIG.CLASSIFICATION_MAX_TOKENS
    );
    const responseContent = mistralApiResponse.choices[0].message.content;
    const extractedJsonString = extractJsonFromResponse(responseContent);
    const editRequestValidationResult =
      safeJsonParse<EditRequestValidationResponse>(
        extractedJsonString,
        "Failed to parse edit request validation response"
      );

    const isEditRequestValid = Boolean(
      editRequestValidationResult.isValid &&
        editRequestValidationResult.confidence >
          MISTRAL_CONFIG.MINIMUM_CONFIDENCE_THRESHOLD
    );

    return {
      isValid: isEditRequestValid,
      reason: isEditRequestValid
        ? undefined
        : editRequestValidationResult.reason,
    };
  } catch (validationError) {
    console.error("Error validating edit request:", validationError);
    const errorMessage =
      validationError instanceof Error
        ? validationError.message
        : ERROR_MESSAGES.UNKNOWN_ERROR;
    throw new Error(`Failed to validate edit request: ${errorMessage}`);
  }
}

export async function classifyContentForEdit(
  resumeText: string,
  editRequestText?: string
): Promise<ClassificationResult> {
  if (editRequestText) {
    const [resumeClassificationResult, editRequestValidationResult] =
      await Promise.all([
        classifyResume(resumeText, true),
        validateEditRequest(editRequestText),
      ]);

    return {
      isResumeValid: resumeClassificationResult.isValid,
      resumeReason: resumeClassificationResult.reason,
      isEditRequestValid: editRequestValidationResult.isValid,
      editRequestReason: editRequestValidationResult.reason,
    };
  }

  const resumeClassificationResult = await classifyResume(resumeText, true);
  return {
    isResumeValid: resumeClassificationResult.isValid,
    resumeReason: resumeClassificationResult.reason,
  };
}

export async function classifyContentForTailor(
  resumeText: string,
  jobDescriptionText: string
): Promise<ClassificationResult> {
  const [resumeClassificationResult, jobDescriptionClassificationResult] =
    await Promise.all([
      classifyResume(resumeText, false),
      classifyJobDescription(jobDescriptionText),
    ]);

  return {
    isResumeValid: resumeClassificationResult.isValid,
    isJobDescriptionValid: jobDescriptionClassificationResult.isValid,
    resumeReason: resumeClassificationResult.reason,
    jobDescriptionReason: jobDescriptionClassificationResult.reason,
  };
}

export async function classifyContent(
  resumeText: string,
  jobDescriptionText: string,
  mode: ClassificationMode = ClassificationMode.TAILOR,
  editRequestText?: string
): Promise<ClassificationResult> {
  if (mode === ClassificationMode.EDIT) {
    return classifyContentForEdit(resumeText, editRequestText);
  }

  return classifyContentForTailor(resumeText, jobDescriptionText);
}
