import { RESUME_JSON_STRUCTURE, OUTPUT_FORMAT_REQUIREMENTS } from "./common.js";

export const EDIT_RESUME_PROMPT = `You are a professional resume editor. Apply the following changes to the resume.

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

export const EDIT_PROMPT_PLACEHOLDERS = {
  EDIT_PROMPT: "{editPrompt}",
  RESUME_DATA: "{resumeData}",
} as const;
