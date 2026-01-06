import { chromium, Browser, Page } from "playwright";
import { getStorage } from "../config/firebase-admin.js";
import {
  STORAGE_CONFIG,
  PDF_CONFIG,
  ERROR_MESSAGES,
} from "../config/constants.js";
import type { ResumeData } from "./mistralService.js";

// Generates CSS styles with dynamic scale for single-page optimization
function generateResumeCSS(scale: number = 1.0): string {
  // Base sizes (will be scaled proportionally to maintain aspect ratio)
  const baseSizes = {
    h1: 22,
    h2: 16,
    h3: 14,
    body: 11,
    meta: 10,
    skill: 10,
    padding: 10,
    marginSection: 12,
    marginItem: 8,
    gap: 8,
  };

  // Scale all sizes proportionally
  const sizes = {
    h1: Math.round(baseSizes.h1 * scale),
    h2: Math.round(baseSizes.h2 * scale),
    h3: Math.round(baseSizes.h3 * scale),
    body: Math.round(baseSizes.body * scale),
    meta: Math.round(baseSizes.meta * scale),
    skill: Math.round(baseSizes.skill * scale),
    padding: Math.round(baseSizes.padding * scale),
    marginSection: Math.round(baseSizes.marginSection * scale),
    marginItem: Math.round(baseSizes.marginItem * scale),
    gap: Math.round(baseSizes.gap * scale),
  };

  return `
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Noto Sans CJK SC', 'Noto Sans CJK TC', 'WenQuanYi Zen Hei', 'WenQuanYi Micro Hei', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'SimHei', 'SimSun', 'Arial Unicode MS', 'Arial', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: ${sizes.padding}px;
      line-height: 1.4;
      color: #333;
      font-size: ${sizes.body}px;
    }
    .header {
      border-bottom: 2px solid #333;
      padding-bottom: ${sizes.gap}px;
      margin-bottom: ${sizes.marginSection}px;
    }
    .header h1 {
      margin: 0;
      font-size: ${sizes.h1}px;
      line-height: 1.2;
    }
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: ${sizes.gap}px;
      margin-top: ${sizes.gap}px;
      font-size: ${sizes.body}px;
    }
    .section {
      margin-bottom: ${sizes.marginSection}px;
      page-break-inside: avoid;
    }
    .section h2 {
      border-bottom: 1px solid #ccc;
      padding-bottom: 4px;
      margin-bottom: ${sizes.gap}px;
      font-size: ${sizes.h2}px;
      line-height: 1.3;
    }
    .experience-item, .education-item {
      margin-bottom: ${sizes.marginItem}px;
      page-break-inside: avoid;
    }
    .experience-item h3, .education-item h3 {
      margin: 0;
      font-size: ${sizes.h3}px;
      line-height: 1.3;
    }
    .experience-item .meta {
      color: #666;
      font-size: ${sizes.meta}px;
      margin: 3px 0;
      line-height: 1.4;
    }
    .experience-item ul {
      margin: ${sizes.gap}px 0;
      padding-left: 18px;
    }
    .experience-item li {
      font-size: ${sizes.meta}px;
      margin-bottom: 2px;
      line-height: 1.4;
    }
    .skills {
      display: flex;
      flex-wrap: wrap;
      gap: ${sizes.gap}px;
    }
    .skill-tag {
      background: #f0f0f0;
      padding: 3px ${sizes.gap}px;
      border-radius: 3px;
      font-size: ${sizes.skill}px;
      line-height: 1.4;
    }
    p {
      margin: 0 0 ${sizes.gap}px 0;
      line-height: 1.4;
    }
  `;
}

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

// Generates complete HTML document from resume data with scale
function generateResumeHTML(
  resumeData: ResumeData,
  scale: number = 1.0
): string {
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
  <style>${generateResumeCSS(scale)}</style>
</head>
<body>
${sections.join("\n")}
</body>
</html>`.trim();
}

// Launches Chromium browser instance
async function launchBrowser(): Promise<Browser> {
  return await chromium.launch({
    headless: true,
    args: PDF_CONFIG.CHROMIUM_ARGS,
  });
}

// Gets content height in pixels from browser page
async function getContentHeight(browserPage: Page): Promise<number> {
  return await browserPage.evaluate(() => {
    // @ts-ignore - document is available in browser context
    const bodyElement = document.body;
    // @ts-ignore - document is available in browser context
    const docElement = document.documentElement;
    return Math.max(
      bodyElement.scrollHeight,
      bodyElement.offsetHeight,
      docElement.clientHeight,
      docElement.scrollHeight,
      docElement.offsetHeight
    );
  });
}

// Generates PDF with automatic scaling to fit one page
async function generateSinglePagePDF(resumeData: ResumeData): Promise<Buffer> {
  let currentScale = PDF_CONFIG.INITIAL_SCALE;
  let pdfBuffer: Buffer | null = null;
  const browserInstance = await launchBrowser();

  try {
    do {
      const resumeHtml = generateResumeHTML(resumeData, currentScale);
      const browserPage: Page = await browserInstance.newPage();
      await browserPage.setContent(resumeHtml, { waitUntil: "networkidle" });

      const contentHeight = await getContentHeight(browserPage);
      const maxHeight = PDF_CONFIG.A4_HEIGHT_PX * currentScale;

      if (contentHeight > maxHeight && currentScale > PDF_CONFIG.MIN_SCALE) {
        await browserPage.close();
        currentScale = Math.max(
          currentScale - PDF_CONFIG.SCALE_STEP,
          PDF_CONFIG.MIN_SCALE
        );
        continue;
      }

      pdfBuffer = await browserPage.pdf({
        format: PDF_CONFIG.FORMAT,
        printBackground: true,
        margin: {
          top: PDF_CONFIG.MARGIN_MM,
          right: PDF_CONFIG.MARGIN_MM,
          bottom: PDF_CONFIG.MARGIN_MM,
          left: PDF_CONFIG.MARGIN_MM,
        },
      });

      await browserPage.close();
      break;
    } while (currentScale > PDF_CONFIG.MIN_SCALE);

    if (!pdfBuffer) {
      throw new Error("Failed to generate PDF within scale limits");
    }

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
    const pdfBuffer = await generateSinglePagePDF(resumeData);
    const storageFilePath = await savePDFToStorage(
      pdfBuffer,
      ownerId,
      documentId
    );
    return storageFilePath;
  } catch (pdfGenerationError) {
    console.error("Error generating PDF:", pdfGenerationError);
    const pdfGenerationErrorMessage =
      pdfGenerationError instanceof Error
        ? pdfGenerationError.message
        : ERROR_MESSAGES.UNKNOWN_ERROR;
    throw new Error(`Failed to generate PDF: ${pdfGenerationErrorMessage}`);
  }
}
