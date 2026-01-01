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

const PROMPT_TEMPLATE = `You are a professional resume writer. Your task is to tailor an existing resume to match a specific job description.

IMPORTANT RULES:
1. DO NOT invent or add any facts, skills, or experiences that are not in the original resume
2. DO NOT change dates, company names, or job titles
3. DO rephrase and reorganize existing content to highlight relevant experience
4. DO emphasize skills and experiences that match the job requirements
5. DO adjust the order of sections to prioritize relevant information
6. Output the tailored resume in Markdown format

Original Resume:
{resumeText}

Job Description:
{jobDescription}

Please provide the tailored resume:`;

// Generates a tailored resume using OpenRouter API based on resume text and job description
export async function generateTailoredResume(
  resumeText: string,
  jobDescription: string
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(ERROR_MESSAGES.OPENROUTER_API_KEY_NOT_CONFIGURED);
  }

  const prompt = PROMPT_TEMPLATE.replace("{resumeText}", resumeText).replace(
    "{jobDescription}",
    jobDescription
  );

  try {
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

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      const errorMessage = ERROR_MESSAGES.OPENROUTER_API_ERROR.replace(
        "{status}",
        apiResponse.status.toString()
      ).replace("{errorText}", errorText);
      throw new Error(errorMessage);
    }

    const chatResponse = (await apiResponse.json()) as OpenRouterResponse;
    const firstChoice = chatResponse.choices[0];
    const tailoredResume = firstChoice?.message?.content;

    if (!tailoredResume) {
      throw new Error(ERROR_MESSAGES.EMPTY_RESPONSE_FROM_OPENROUTER);
    }

    return tailoredResume;
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `${ERROR_MESSAGES.FAILED_TO_GENERATE_RESUME}: ${errorMessage}`
    );
  }
}
