import {
  ERROR_MESSAGES,
  MISTRAL_CONFIG,
  MISTRAL_MESSAGE_ROLES,
} from "../config/constants.js";
import {
  callMistralAPI,
  extractJsonFromResponse,
  type MistralMessage,
} from "../utils/mistralClient.js";
import { safeJsonParse } from "../utils/jsonUtils.js";

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

// Common JSON structure used in all prompts
const RESUME_JSON_STRUCTURE = `{
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
}`;

const OUTPUT_FORMAT_REQUIREMENTS = `OUTPUT FORMAT REQUIREMENTS:
- You MUST return ONLY a valid JSON object
- DO NOT include markdown code blocks (no \`\`\`json or \`\`\`)
- DO NOT include any text before or after the JSON object
- DO NOT include explanations, comments, or additional text
- The response must start with { and end with }
- The JSON must be valid and parseable`;

const PROMPT_TEMPLATE = `You are a professional resume writer. Your task is to tailor an existing resume to match a specific job description.

CRITICAL RULES - STRICTLY FOLLOW:
1. DO NOT invent, add, or modify any facts, skills, experiences, dates, company names, or job titles that are not in the original resume
2. DO rephrase and reorganize existing content to highlight relevant experience for the job
3. DO emphasize skills and experiences that match the job requirements
4. DO adjust the order of sections to prioritize relevant information

${OUTPUT_FORMAT_REQUIREMENTS}

REQUIRED JSON STRUCTURE:
${RESUME_JSON_STRUCTURE}

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
${RESUME_JSON_STRUCTURE}

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

${OUTPUT_FORMAT_REQUIREMENTS}

REQUIRED JSON STRUCTURE:
${RESUME_JSON_STRUCTURE}

Original Resume Data (JSON):
{resumeData}

CRITICAL: Return ONLY the updated JSON structure in the same format. Start with { and end with }.`;

async function callMistralAPIWithErrorHandling(
  messages: MistralMessage[],
  operationName: string,
  errorMessagePrefix: string
): Promise<ResumeData> {
  try {
    const mistralApiResponse = await callMistralAPI(messages);
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
  const formattedPrompt = PROMPT_TEMPLATE.replace(
    "{resumeText}",
    resumeText
  ).replace("{jobDescription}", jobDescription);

  const mistralMessages: MistralMessage[] = [
    { role: MISTRAL_MESSAGE_ROLES.USER, content: formattedPrompt },
  ];

  return callMistralAPIWithErrorHandling(
    mistralMessages,
    "calling Mistral API for resume generation",
    ERROR_MESSAGES.FAILED_TO_GENERATE_RESUME
  );
}

export async function parseResumeToStructure(
  resumeText: string
): Promise<ResumeData> {
  const formattedPrompt = PARSE_RESUME_PROMPT.replace(
    "{resumeText}",
    resumeText
  );
  const mistralMessages: MistralMessage[] = [
    { role: MISTRAL_MESSAGE_ROLES.USER, content: formattedPrompt },
  ];

  return callMistralAPIWithErrorHandling(
    mistralMessages,
    "parsing resume",
    "Failed to parse resume"
  );
}

export async function editResumeWithPrompt(
  resumeData: ResumeData,
  editPrompt: string
): Promise<ResumeData> {
  const resumeDataJsonString = JSON.stringify(resumeData, null, 2);
  const formattedPrompt = EDIT_RESUME_PROMPT.replace(
    "{editPrompt}",
    editPrompt
  ).replace("{resumeData}", resumeDataJsonString);

  const mistralMessages: MistralMessage[] = [
    { role: MISTRAL_MESSAGE_ROLES.USER, content: formattedPrompt },
  ];

  return callMistralAPIWithErrorHandling(
    mistralMessages,
    "calling Mistral API for resume editing",
    ERROR_MESSAGES.FAILED_TO_EDIT_RESUME
  );
}
