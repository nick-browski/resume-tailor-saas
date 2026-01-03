import {
  OPENROUTER_CONFIG,
  ERROR_MESSAGES,
  REQUEST_HEADERS,
  HTTP_METHODS,
} from "../config/constants.js";

// Delays execution for retry logic
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || OPENROUTER_CONFIG.DEFAULT_MODEL;
const OPENROUTER_API_URL = OPENROUTER_CONFIG.API_URL;
const MAX_TOKENS = OPENROUTER_CONFIG.MAX_TOKENS;

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

const PROMPT_TEMPLATE = `You are a professional resume writer. Your task is to tailor an existing resume to match a specific job description.

CRITICAL RULES - STRICTLY FOLLOW:
1. DO NOT invent, add, or modify any facts, skills, experiences, dates, company names, or job titles that are not in the original resume
2. DO rephrase and reorganize existing content to highlight relevant experience for the job
3. DO emphasize skills and experiences that match the job requirements
4. DO adjust the order of sections to prioritize relevant information

OUTPUT FORMAT REQUIREMENTS:
- You MUST return ONLY a valid JSON object
- DO NOT include markdown code blocks (no \`\`\`json or \`\`\`)
- DO NOT include any text before or after the JSON object
- DO NOT include explanations, comments, or additional text
- The response must start with { and end with }
- The JSON must be valid and parseable

REQUIRED JSON STRUCTURE:
{
  "personalInfo": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedIn": "string (optional)",
    "website": "string (optional)"
  },
  "summary": "string",
  "experience": [
    {
      "company": "string",
      "position": "string",
      "startDate": "string",
      "endDate": "string | 'Present'",
      "description": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string (optional)",
      "graduationDate": "string"
    }
  ],
  "skills": ["string"],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string (optional)"
    }
  ]
}

Original Resume:
{resumeText}

Job Description:
{jobDescription}

CRITICAL: Return ONLY the JSON object, nothing else. No markdown, no code blocks, no explanations. Start with { and end with }.`;

const PARSE_RESUME_PROMPT = `You are a professional resume parser. Your task is to extract structured data from a resume text.

IMPORTANT RULES:
1. Extract ONLY information that is explicitly stated in the resume
2. DO NOT invent or add any information
3. If information is missing, use empty strings or empty arrays
4. Return ONLY valid JSON, no markdown, no explanations

REQUIRED JSON STRUCTURE:
{
  "personalInfo": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedIn": "string (optional)",
    "website": "string (optional)"
  },
  "summary": "string",
  "experience": [
    {
      "company": "string",
      "position": "string",
      "startDate": "string",
      "endDate": "string | 'Present'",
      "description": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string (optional)",
      "graduationDate": "string"
    }
  ],
  "skills": ["string"],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string (optional)"
    }
  ]
}

Resume Text:
{resumeText}

CRITICAL: Return ONLY the JSON object, nothing else. No markdown, no code blocks, no explanations. Start with { and end with }.`;

const EDIT_RESUME_PROMPT = `You are a professional resume editor. Apply the following changes to the resume.

User request: {editPrompt}

CRITICAL RULES:
1. DO NOT add new information that is not in the original resume
2. DO NOT invent facts, dates, companies, or skills
3. ONLY modify what the user explicitly requested
4. Preserve all other information exactly as it was
5. If the user's request is unclear or cannot be applied, preserve the original data

OUTPUT FORMAT REQUIREMENTS:
- You MUST return ONLY a valid JSON object
- DO NOT include markdown code blocks (no \`\`\`json or \`\`\`)
- DO NOT include any text before or after the JSON object
- DO NOT include explanations, comments, or additional text
- The response must start with { and end with }
- The JSON must be valid and parseable

REQUIRED JSON STRUCTURE:
{
  "personalInfo": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedIn": "string (optional)",
    "website": "string (optional)"
  },
  "summary": "string",
  "experience": [
    {
      "company": "string",
      "position": "string",
      "startDate": "string",
      "endDate": "string | 'Present'",
      "description": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string (optional)",
      "graduationDate": "string"
    }
  ],
  "skills": ["string"],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string (optional)"
    }
  ]
}

Original Resume Data (JSON):
{resumeData}

CRITICAL: Return ONLY the updated JSON structure in the same format. Start with { and end with }.`;

function extractJsonFromResponse(responseText: string): string {
  let cleanedResponseText = responseText.trim();
  cleanedResponseText = cleanedResponseText.replace(/^```json\s*/i, "");
  cleanedResponseText = cleanedResponseText.replace(/^```\s*/, "");
  cleanedResponseText = cleanedResponseText.replace(/\s*```\s*$/, "");

  const jsonStartIndex = cleanedResponseText.indexOf("{");
  const jsonEndIndex = cleanedResponseText.lastIndexOf("}");

  if (
    jsonStartIndex !== -1 &&
    jsonEndIndex !== -1 &&
    jsonEndIndex > jsonStartIndex
  ) {
    return cleanedResponseText.substring(jsonStartIndex, jsonEndIndex + 1);
  }

  return cleanedResponseText;
}

async function processOpenRouterResponse(
  apiResponse: Response
): Promise<ResumeData> {
  const chatResponse = (await apiResponse.json()) as OpenRouterResponse;
  const firstChoice = chatResponse.choices[0];
  const responseContent = firstChoice?.message?.content;

  if (!responseContent) {
    throw new Error(ERROR_MESSAGES.EMPTY_RESPONSE_FROM_OPENROUTER);
  }

  const extractedJsonString = extractJsonFromResponse(responseContent);

  try {
    return JSON.parse(extractedJsonString) as ResumeData;
  } catch (jsonParsingError) {
    console.error("Failed to parse JSON response:", jsonParsingError);
    console.error("Response content:", extractedJsonString);
    const parsingErrorMessage =
      jsonParsingError instanceof Error
        ? jsonParsingError.message
        : ERROR_MESSAGES.UNKNOWN_ERROR;
    throw new Error(
      `Failed to parse AI response as JSON: ${parsingErrorMessage}`
    );
  }
}

// Makes API request with automatic retry for transient errors
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

  const errorResponseText = await apiResponse.text();
  const apiErrorMessage = ERROR_MESSAGES.OPENROUTER_API_ERROR.replace(
    "{status}",
    apiResponse.status.toString()
  ).replace("{errorText}", errorResponseText);
  throw new Error(apiErrorMessage);
}

export async function generateTailoredResume(
  resumeText: string,
  jobDescription: string
): Promise<ResumeData> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(ERROR_MESSAGES.OPENROUTER_API_KEY_NOT_CONFIGURED);
  }

  const prompt = PROMPT_TEMPLATE.replace("{resumeText}", resumeText).replace(
    "{jobDescription}",
    jobDescription
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
    return await processOpenRouterResponse(apiResponse);
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `${ERROR_MESSAGES.FAILED_TO_GENERATE_RESUME}: ${errorMessage}`
    );
  }
}

// Parses resume text into structured JSON format
export async function parseResumeToStructure(
  resumeText: string
): Promise<ResumeData> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(ERROR_MESSAGES.OPENROUTER_API_KEY_NOT_CONFIGURED);
  }

  const prompt = PARSE_RESUME_PROMPT.replace("{resumeText}", resumeText);

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
    return await processOpenRouterResponse(apiResponse);
  } catch (parsingError) {
    console.error("Error parsing resume:", parsingError);
    const parsingErrorMessage =
      parsingError instanceof Error
        ? parsingError.message
        : ERROR_MESSAGES.UNKNOWN_ERROR;
    throw new Error(`Failed to parse resume: ${parsingErrorMessage}`);
  }
}

// Edits resume based on user prompt
export async function editResumeWithPrompt(
  resumeData: ResumeData,
  editPrompt: string
): Promise<ResumeData> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(ERROR_MESSAGES.OPENROUTER_API_KEY_NOT_CONFIGURED);
  }

  const resumeDataJson = JSON.stringify(resumeData, null, 2);
  const prompt = EDIT_RESUME_PROMPT.replace("{editPrompt}", editPrompt).replace(
    "{resumeData}",
    resumeDataJson
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
    return await processOpenRouterResponse(apiResponse);
  } catch (editingError) {
    console.error(
      "Error calling OpenRouter API for resume editing:",
      editingError
    );
    const editingErrorMessage =
      editingError instanceof Error
        ? editingError.message
        : ERROR_MESSAGES.UNKNOWN_ERROR;
    throw new Error(`Failed to edit resume: ${editingErrorMessage}`);
  }
}
