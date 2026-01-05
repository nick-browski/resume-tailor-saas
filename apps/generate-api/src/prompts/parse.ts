import { RESUME_JSON_STRUCTURE } from "./common.js";

export const PARSE_RESUME_PROMPT = `You are a professional resume parser. Your task is to extract structured data from a resume text.

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

export const PARSE_PROMPT_PLACEHOLDERS = {
  RESUME_TEXT: "{resumeText}",
} as const;
