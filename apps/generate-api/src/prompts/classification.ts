export const RESUME_CLASSIFICATION_PROMPT = `You are a content classifier. Analyze the provided text and determine if it is a resume/CV.

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

export const RESUME_CLASSIFICATION_PROMPT_FOR_EDIT = `You are a content classifier. Analyze the provided text and determine if it is a valid, well-structured resume/CV that has been edited or customized.

A valid edited resume/CV must contain:
- Personal information (name, email, phone, location)
- Professional summary or objective
- Work experience with job titles, companies, dates, and responsibilities
- Education (degrees, institutions, graduation dates)
- Skills (technical and soft skills)
- Optional: certifications, projects, languages

The resume should be complete, coherent, and properly formatted. Reject incomplete, malformed, or nonsensical content.

Return ONLY a valid JSON object with this structure:
{
  "isResume": boolean,
  "confidence": number (0-1),
  "reason": "string explaining your decision in one sentence"
}

Text to classify:
{text}`;

export const JOB_DESCRIPTION_CLASSIFICATION_PROMPT = `You are a content classifier. Analyze the provided text and determine if it is a job description.

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

export const EDIT_REQUEST_VALIDATION_PROMPT = `You are a validator for resume edit requests. Analyze the provided text and determine if it is a specific, logical description of changes that need to be made to a resume.

A valid edit request must:
- Be specific about what needs to be changed (e.g., "Update the job title for the position at Company X from 'Developer' to 'Senior Developer'")
- Describe concrete modifications (e.g., "Add Python to the skills section", "Update the summary to emphasize backend development experience")
- Be actionable and clear (e.g., "Change the start date of my current position to January 2023", "Remove the certification section")
- Focus on resume content modifications

Invalid edit requests include:
- Vague or generic requests (e.g., "make it better", "improve it", "update resume")
- Non-specific instructions (e.g., "change some things", "fix errors")
- Requests that don't describe concrete changes (e.g., "review this", "check my resume")
- Random text or unrelated content

Return ONLY a valid JSON object with this structure:
{
  "isValid": boolean,
  "confidence": number (0-1),
  "reason": "string explaining your decision in one sentence"
}

Edit request to validate:
{text}`;

export const CLASSIFICATION_PROMPT_PLACEHOLDERS = {
  TEXT: "{text}",
} as const;
