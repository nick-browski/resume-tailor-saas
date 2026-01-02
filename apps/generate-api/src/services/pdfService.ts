import { chromium, Browser, Page } from "playwright";
import { getStorage } from "../config/firebase-admin.js";
import { STORAGE_CONFIG, PDF_CONFIG } from "../config/constants.js";
import type { ResumeData } from "./openRouterService.js";

// CSS styles for resume HTML
const RESUME_CSS_STYLES = `
    body {
      font-family: 'Arial', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    .header {
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-top: 10px;
      font-size: 14px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section h2 {
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
      margin-bottom: 15px;
      font-size: 20px;
    }
    .experience-item, .education-item {
      margin-bottom: 15px;
    }
    .experience-item h3, .education-item h3 {
      margin: 0;
      font-size: 16px;
    }
    .experience-item .meta {
      color: #666;
      font-size: 14px;
      margin: 5px 0;
    }
    .experience-item ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .skills {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .skill-tag {
      background: #f0f0f0;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 14px;
    }
`;

// Escapes HTML to prevent XSS
function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(
    /[&<>"']/g,
    (matchedCharacter) => htmlEscapeMap[matchedCharacter]
  );
}

// Generates header section with personal info and contact details
function generateHeaderSection(
  personalInfo: ResumeData["personalInfo"]
): string {
  const contactItems = [
    escapeHtml(personalInfo.email),
    escapeHtml(personalInfo.phone),
    escapeHtml(personalInfo.location),
  ];

  if (personalInfo.linkedIn) {
    contactItems.push(`LinkedIn: ${escapeHtml(personalInfo.linkedIn)}`);
  }

  if (personalInfo.website) {
    contactItems.push(`Website: ${escapeHtml(personalInfo.website)}`);
  }

  return `
  <div class="header">
    <h1>${escapeHtml(personalInfo.fullName)}</h1>
    <div class="contact-info">
      ${contactItems.map((item) => `<span>${item}</span>`).join("\n      ")}
    </div>
  </div>`;
}

// Generates summary section
function generateSummarySection(summary: string): string {
  return `
  <div class="section">
    <h2>Summary</h2>
    <p>${escapeHtml(summary)}</p>
  </div>`;
}

// Generates experience section
function generateExperienceSection(
  experience: ResumeData["experience"]
): string {
  if (experience.length === 0) {
    return "";
  }

  const experienceItems = experience
    .map(
      (experienceItem) => `
      <div class="experience-item">
        <h3>${escapeHtml(experienceItem.position)}</h3>
        <div class="meta">${escapeHtml(experienceItem.company)} | ${escapeHtml(
        experienceItem.startDate
      )} - ${escapeHtml(experienceItem.endDate)}</div>
        <ul>
          ${experienceItem.description
            .map((descriptionItem) => `<li>${escapeHtml(descriptionItem)}</li>`)
            .join("")}
        </ul>
      </div>`
    )
    .join("");

  return `
  <div class="section">
    <h2>Experience</h2>
    ${experienceItems}
  </div>`;
}

// Generates education section
function generateEducationSection(education: ResumeData["education"]): string {
  if (education.length === 0) {
    return "";
  }

  const educationItems = education
    .map(
      (educationItem) => `
      <div class="education-item">
        <h3>${escapeHtml(educationItem.degree)}${
        educationItem.field ? ` in ${escapeHtml(educationItem.field)}` : ""
      }</h3>
        <div class="meta">${escapeHtml(
          educationItem.institution
        )} | ${escapeHtml(educationItem.graduationDate)}</div>
      </div>`
    )
    .join("");

  return `
  <div class="section">
    <h2>Education</h2>
    ${educationItems}
  </div>`;
}

// Generates skills section
function generateSkillsSection(skills: ResumeData["skills"]): string {
  if (skills.length === 0) {
    return "";
  }

  const skillTags = skills
    .map((skill) => `<span class="skill-tag">${escapeHtml(skill)}</span>`)
    .join("");

  return `
  <div class="section">
    <h2>Skills</h2>
    <div class="skills">
      ${skillTags}
    </div>
  </div>`;
}

// Generates certifications section
function generateCertificationsSection(
  certifications: ResumeData["certifications"]
): string {
  if (!certifications || certifications.length === 0) {
    return "";
  }

  const certificationItems = certifications
    .map(
      (certification) => `
      <div class="education-item">
        <h3>${escapeHtml(certification.name)}</h3>
        <div class="meta">${escapeHtml(certification.issuer)}${
        certification.date ? ` | ${escapeHtml(certification.date)}` : ""
      }</div>
      </div>`
    )
    .join("");

  return `
  <div class="section">
    <h2>Certifications</h2>
    ${certificationItems}
  </div>`;
}

// Generates complete HTML document from resume data
function generateResumeHTML(resumeData: ResumeData): string {
  const sections = [
    generateHeaderSection(resumeData.personalInfo),
    resumeData.summary ? generateSummarySection(resumeData.summary) : "",
    generateExperienceSection(resumeData.experience),
    generateEducationSection(resumeData.education),
    generateSkillsSection(resumeData.skills),
    generateCertificationsSection(resumeData.certifications),
  ].filter((section) => section.trim() !== "");

  return `<!DOCTYPE html>
<html lang="${PDF_CONFIG.HTML_LANG}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${PDF_CONFIG.HTML_TITLE}</title>
  <style>${RESUME_CSS_STYLES}</style>
</head>
<body>
${sections.join("\n")}
</body>
</html>`.trim();
}

// Launches Chromium browser instance
async function launchBrowser(): Promise<Browser> {
  const chromiumExecutablePath = process.env.CHROMIUM_PATH;
  return await chromium.launch({
    headless: true,
    ...(chromiumExecutablePath
      ? { executablePath: chromiumExecutablePath }
      : {}),
  });
}

// Generates PDF buffer from HTML content using Playwright
async function generatePDFFromHTML(htmlContent: string): Promise<Buffer> {
  const browserInstance = await launchBrowser();

  try {
    const browserPage: Page = await browserInstance.newPage();
    await browserPage.setContent(htmlContent, { waitUntil: "networkidle" });

    const pdfBuffer = await browserPage.pdf({
      format: PDF_CONFIG.FORMAT,
      printBackground: true,
      margin: {
        top: PDF_CONFIG.MARGIN_MM,
        right: PDF_CONFIG.MARGIN_MM,
        bottom: PDF_CONFIG.MARGIN_MM,
        left: PDF_CONFIG.MARGIN_MM,
      },
    });

    return pdfBuffer;
  } finally {
    await browserInstance.close();
  }
}

// Saves PDF buffer to Firebase Storage and returns file path
async function savePDFToStorage(
  pdfBuffer: Buffer,
  ownerId: string,
  documentId: string
): Promise<string> {
  const storageBucket = getStorage().bucket();
  const fileTimestamp = Date.now();
  const storageFilePath = `${STORAGE_CONFIG.RESUMES_FOLDER}/${ownerId}/${documentId}-tailored-${fileTimestamp}.pdf`;
  const storageFileReference = storageBucket.file(storageFilePath);

  await storageFileReference.save(pdfBuffer, {
    contentType: STORAGE_CONFIG.PDF_CONTENT_TYPE,
  });

  return storageFileReference.name;
}

// Generates PDF from resume data using Playwright and saves to Storage
export async function generatePDFFromResumeData(
  resumeData: ResumeData,
  ownerId: string,
  documentId: string
): Promise<string> {
  try {
    const resumeHtml = generateResumeHTML(resumeData);
    const pdfBuffer = await generatePDFFromHTML(resumeHtml);
    const storageFilePath = await savePDFToStorage(
      pdfBuffer,
      ownerId,
      documentId
    );
    return storageFilePath;
  } catch (pdfGenerationError) {
    console.error("Error generating PDF:", pdfGenerationError);
    const errorMessage =
      pdfGenerationError instanceof Error
        ? pdfGenerationError.message
        : "Unknown error";
    throw new Error(`Failed to generate PDF: ${errorMessage}`);
  }
}
