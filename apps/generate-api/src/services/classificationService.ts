import {
  OPENROUTER_CONFIG,
  ERROR_MESSAGES,
  REQUEST_HEADERS,
  HTTP_METHODS,
} from "../config/constants.js";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || OPENROUTER_CONFIG.DEFAULT_MODEL;
const OPENROUTER_API_URL = OPENROUTER_CONFIG.API_URL;
const MAX_TOKENS = 512;

interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
}

interface OpenRouterChoice {
  message: {
    role: string;
    content: string;
  };
}

interface OpenRouterResponse {
  choices: OpenRouterChoice[];
}

interface ClassificationResponse {
  isResume: boolean;
  isJobDescription: boolean;
  confidence: number;
  reason: string;
}

const RESUME_CLASSIFICATION_PROMPT = `You are a content classifier. Analyze the provided text and determine if it is a resume/CV.

A resume/CV typically contains:
- Personal information (name, email, phone, location)
- Professional summary or objective
- Work experience with job titles, companies, dates, and responsibilities
- Education (degrees, institutions, graduation dates)
- Skills (technical and soft skills)
- Optional: certifications, projects, languages

Return ONLY a valid JSON object with this structure:
{
  "isResume": boolean,
  "confidence": number (0-1),
  "reason": "string explaining your decision in one sentence"
}

Text to classify:
{text}`;

const JOB_DESCRIPTION_CLASSIFICATION_PROMPT = `You are a content classifier. Analyze the provided text and determine if it is a job description.

A job description typically contains:
- Job title and company information
- Job responsibilities and duties
- Required qualifications (education, experience, skills)
- Preferred qualifications
- Company information or benefits
- Application instructions

Return ONLY a valid JSON object with this structure:
{
  "isJobDescription": boolean,
  "confidence": number (0-1),
  "reason": "string explaining your decision in one sentence"
}

Text to classify:
{text}`;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJsonFromResponse(responseText: string): string {
  const cleanedText = responseText.trim();
  const firstBraceIndex = cleanedText.indexOf("{");
  const lastBraceIndex = cleanedText.lastIndexOf("}");

  if (
    firstBraceIndex !== -1 &&
    lastBraceIndex !== -1 &&
    lastBraceIndex > firstBraceIndex
  ) {
    return cleanedText.substring(firstBraceIndex, lastBraceIndex + 1);
  }

  return cleanedText;
}

async function makeOpenRouterRequest(
  requestBody: OpenRouterRequest,
  attemptNumber: number = 1
): Promise<Response> {
  const httpReferer = process.env.OPENROUTER_HTTP_REFERER || "";
  const apiResponse = await fetch(OPENROUTER_API_URL, {
    method: HTTP_METHODS.POST,
    headers: {
      Authorization: `${REQUEST_HEADERS.AUTHORIZATION_PREFIX}${OPENROUTER_API_KEY}`,
      "Content-Type": REQUEST_HEADERS.CONTENT_TYPE_JSON,
      [REQUEST_HEADERS.HTTP_REFERER]: httpReferer,
      [REQUEST_HEADERS.X_TITLE]: OPENROUTER_CONFIG.APPLICATION_TITLE,
    },
    body: JSON.stringify(requestBody),
  });

  if (apiResponse.ok) {
    return apiResponse;
  }

  const isRetriableError = (
    OPENROUTER_CONFIG.RETRIABLE_STATUS_CODES as readonly number[]
  ).includes(apiResponse.status);
  const hasRetriesLeft = attemptNumber < OPENROUTER_CONFIG.MAX_RETRIES;

  if (isRetriableError && hasRetriesLeft) {
    const retryDelayMs = OPENROUTER_CONFIG.RETRY_DELAY_MS * attemptNumber;
    console.warn(
      `OpenRouter API error ${apiResponse.status}, retrying in ${retryDelayMs}ms (attempt ${attemptNumber}/${OPENROUTER_CONFIG.MAX_RETRIES})`
    );
    await delay(retryDelayMs);
    return makeOpenRouterRequest(requestBody, attemptNumber + 1);
  }

  const errorText = await apiResponse.text();
  const errorMessage = ERROR_MESSAGES.OPENROUTER_API_ERROR.replace(
    "{status}",
    apiResponse.status.toString()
  ).replace("{errorText}", errorText);
  throw new Error(errorMessage);
}

export interface ClassificationResult {
  isResumeValid: boolean;
  isJobDescriptionValid: boolean;
  resumeReason?: string;
  jobDescriptionReason?: string;
  extractedResumeText?: string;
}

export async function classifyResume(
  resumeText: string
): Promise<{ isValid: boolean; reason?: string }> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(ERROR_MESSAGES.OPENROUTER_API_KEY_NOT_CONFIGURED);
  }

  if (!resumeText || !resumeText.trim()) {
    return { isValid: false, reason: "Resume text is empty" };
  }

  const prompt = RESUME_CLASSIFICATION_PROMPT.replace(
    "{text}",
    resumeText.substring(0, 2000)
  );

  const requestBody: OpenRouterRequest = {
    model: OPENROUTER_MODEL,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: MAX_TOKENS,
  };

  try {
    const apiResponse = await makeOpenRouterRequest(requestBody);
    const chatResponse = (await apiResponse.json()) as OpenRouterResponse;
    const firstChoice = chatResponse.choices[0];
    const responseContent = firstChoice?.message?.content;

    if (!responseContent) {
      throw new Error(ERROR_MESSAGES.EMPTY_RESPONSE_FROM_OPENROUTER);
    }

    const extractedJsonString = extractJsonFromResponse(responseContent);

    try {
      const classification = JSON.parse(
        extractedJsonString
      ) as ClassificationResponse;
      const isValid = classification.isResume && classification.confidence > 0.5;
      return {
        isValid,
        reason: isValid ? undefined : classification.reason,
      };
    } catch (jsonParseError) {
      console.error("Failed to parse classification JSON:", jsonParseError);
      console.error("Response content:", extractedJsonString);
      return {
        isValid: false,
        reason: "Failed to analyze resume content",
      };
    }
  } catch (error) {
    console.error("Error classifying resume:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to classify resume: ${errorMessage}`);
  }
}

export async function classifyJobDescription(
  jobDescriptionText: string
): Promise<{ isValid: boolean; reason?: string }> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(ERROR_MESSAGES.OPENROUTER_API_KEY_NOT_CONFIGURED);
  }

  if (!jobDescriptionText || !jobDescriptionText.trim()) {
    return { isValid: false, reason: "Job description text is empty" };
  }

  const prompt = JOB_DESCRIPTION_CLASSIFICATION_PROMPT.replace(
    "{text}",
    jobDescriptionText.substring(0, 2000)
  );

  const requestBody: OpenRouterRequest = {
    model: OPENROUTER_MODEL,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: MAX_TOKENS,
  };

  try {
    const apiResponse = await makeOpenRouterRequest(requestBody);
    const chatResponse = (await apiResponse.json()) as OpenRouterResponse;
    const firstChoice = chatResponse.choices[0];
    const responseContent = firstChoice?.message?.content;

    if (!responseContent) {
      throw new Error(ERROR_MESSAGES.EMPTY_RESPONSE_FROM_OPENROUTER);
    }

    const extractedJsonString = extractJsonFromResponse(responseContent);

    try {
      const classification = JSON.parse(
        extractedJsonString
      ) as ClassificationResponse;
      const isValid =
        classification.isJobDescription && classification.confidence > 0.5;
      return {
        isValid,
        reason: isValid ? undefined : classification.reason,
      };
    } catch (jsonParseError) {
      console.error(
        "Failed to parse classification JSON:",
        jsonParseError
      );
      console.error("Response content:", extractedJsonString);
      return {
        isValid: false,
        reason: "Failed to analyze job description content",
      };
    }
  } catch (error) {
    console.error("Error classifying job description:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to classify job description: ${errorMessage}`);
  }
}

export async function classifyContent(
  resumeText: string,
  jobDescriptionText: string
): Promise<ClassificationResult> {
  const [resumeClassification, jobDescriptionClassification] =
    await Promise.all([
      classifyResume(resumeText),
      classifyJobDescription(jobDescriptionText),
    ]);

  return {
    isResumeValid: resumeClassification.isValid,
    isJobDescriptionValid: jobDescriptionClassification.isValid,
    resumeReason: resumeClassification.reason,
    jobDescriptionReason: jobDescriptionClassification.reason,
  };
}

