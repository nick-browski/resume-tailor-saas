export const RESUME_JSON_STRUCTURE = `{
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

export const OUTPUT_FORMAT_REQUIREMENTS = `OUTPUT FORMAT REQUIREMENTS:
- You MUST return ONLY a valid JSON object
- DO NOT include markdown code blocks (no \`\`\`json or \`\`\`)
- DO NOT include any text before or after the JSON object
- DO NOT include explanations, comments, or additional text
- The response must start with { and end with }
- The JSON must be valid and parseable`;
