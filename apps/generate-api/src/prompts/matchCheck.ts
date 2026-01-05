export const MATCH_CHECK_PROMPT_TEMPLATE = `You are a professional recruiter analyzing the compatibility between a resume and a job description.

Analyze the provided resume and job description to determine if the candidate is a good match for the position.

Consider:
- Required technical skills (programming languages, frameworks, tools)
- Years of experience and seniority level
- Domain expertise and industry knowledge
- Education requirements
- Key responsibilities alignment

Return ONLY a valid JSON object with this structure:
{
  "isMatch": boolean,
  "matchScore": number (0-1, where 1 is perfect match),
  "reasons": ["string array of specific reasons why it's a match or not"],
  "missingSkills": ["array of required skills missing from resume"],
  "matchingSkills": ["array of skills that match between resume and job"],
  "confidence": number (0-1, confidence in your analysis)
}

Resume text:
{resumeText}

Job description:
{jobText}`;

export const MATCH_CHECK_PROMPT_PLACEHOLDERS = {
  RESUME_TEXT: "{resumeText}",
  JOB_TEXT: "{jobText}",
} as const;
