import {
  ERROR_MESSAGES,
  MISTRAL_CONFIG,
  MISTRAL_MESSAGE_ROLES,
} from "../config/constants.js";
import { callMistralAPI, type MistralMessage } from "../utils/mistralClient.js";
import { safeJsonParse, extractJsonFromResponse } from "../utils/jsonUtils.js";
import {
  TAILOR_PROMPT_TEMPLATE,
  TAILOR_PROMPT_PLACEHOLDERS,
  PARSE_RESUME_PROMPT,
  PARSE_PROMPT_PLACEHOLDERS,
  EDIT_RESUME_PROMPT,
  EDIT_PROMPT_PLACEHOLDERS,
} from "../prompts/index.js";

export interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    website?: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string | "Present";
    description: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    graduationDate: string;
  }>;
  skills: string[];
  certifications?: Array<{
    name: string;
    issuer: string;
    date?: string;
  }>;
}

async function callMistralAPIWithErrorHandling(
  messages: MistralMessage[],
  operationName: string,
  errorMessagePrefix: string,
  maxTokens?: number
): Promise<ResumeData> {
  try {
    const mistralApiResponse = await callMistralAPI(messages, maxTokens);
    const responseContent = mistralApiResponse.choices[0].message.content;
    const extractedJsonString = extractJsonFromResponse(responseContent);
    return safeJsonParse<ResumeData>(
      extractedJsonString,
      "Failed to parse AI response as JSON"
    );
  } catch (apiError) {
    console.error(`Error ${operationName}:`, apiError);
    const errorMessage =
      apiError instanceof Error
        ? apiError.message
        : ERROR_MESSAGES.UNKNOWN_ERROR;
    throw new Error(`${errorMessagePrefix}: ${errorMessage}`);
  }
}

export async function generateTailoredResume(
  resumeText: string,
  jobDescription: string
): Promise<ResumeData> {
  const formattedPrompt = TAILOR_PROMPT_TEMPLATE.replace(
    TAILOR_PROMPT_PLACEHOLDERS.RESUME_TEXT,
    resumeText
  ).replace(TAILOR_PROMPT_PLACEHOLDERS.JOB_DESCRIPTION, jobDescription);

  const mistralMessages: MistralMessage[] = [
    { role: MISTRAL_MESSAGE_ROLES.USER, content: formattedPrompt },
  ];

  return callMistralAPIWithErrorHandling(
    mistralMessages,
    "calling Mistral API for resume generation",
    ERROR_MESSAGES.FAILED_TO_GENERATE_RESUME,
    MISTRAL_CONFIG.EDIT_MAX_TOKENS
  );
}

export async function parseResumeToStructure(
  resumeText: string
): Promise<ResumeData> {
  const formattedPrompt = PARSE_RESUME_PROMPT.replace(
    PARSE_PROMPT_PLACEHOLDERS.RESUME_TEXT,
    resumeText
  );
  const mistralMessages: MistralMessage[] = [
    { role: MISTRAL_MESSAGE_ROLES.USER, content: formattedPrompt },
  ];

  return callMistralAPIWithErrorHandling(
    mistralMessages,
    "parsing resume",
    "Failed to parse resume",
    MISTRAL_CONFIG.EDIT_MAX_TOKENS
  );
}

export async function editResumeWithPrompt(
  resumeData: ResumeData,
  editPrompt: string
): Promise<ResumeData> {
  const resumeDataJsonString = JSON.stringify(resumeData, null, 2);
  const formattedPrompt = EDIT_RESUME_PROMPT.replace(
    EDIT_PROMPT_PLACEHOLDERS.EDIT_PROMPT,
    editPrompt
  ).replace(EDIT_PROMPT_PLACEHOLDERS.RESUME_DATA, resumeDataJsonString);

  const mistralMessages: MistralMessage[] = [
    { role: MISTRAL_MESSAGE_ROLES.USER, content: formattedPrompt },
  ];

  return callMistralAPIWithErrorHandling(
    mistralMessages,
    "calling Mistral API for resume editing",
    ERROR_MESSAGES.FAILED_TO_EDIT_RESUME,
    MISTRAL_CONFIG.EDIT_MAX_TOKENS
  );
}
