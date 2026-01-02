import { getDb } from "../config/firebase-admin.js";
import { generateTailoredResume } from "./openRouterService.js";
import { generatePDFFromResumeData } from "./pdfService.js";
import {
  FIREBASE_CONFIG,
  DOCUMENT_STATUS,
  ERROR_MESSAGES,
} from "../config/constants.js";

const DOCUMENTS_COLLECTION_NAME = FIREBASE_CONFIG.DOCUMENTS_COLLECTION_NAME;
const EXPECTED_STATUS_FOR_GENERATION = DOCUMENT_STATUS.PARSED;

// Processes generation asynchronously in the background
async function processGeneration(
  documentId: string,
  resumeText: string,
  jobText: string,
  ownerId: string
): Promise<void> {
  const database = getDb();
  const documentReference = database
    .collection(DOCUMENTS_COLLECTION_NAME)
    .doc(documentId);

  try {
    // Get JSON resume data from AI
    const resumeData = await generateTailoredResume(resumeText, jobText);

    // Generate PDF from JSON
    const pdfPath = await generatePDFFromResumeData(
      resumeData,
      ownerId,
      documentId
    );

    await documentReference.update({
      status: DOCUMENT_STATUS.GENERATED,
      tailoredText: JSON.stringify(resumeData),
      tailoredResumeData: JSON.stringify(resumeData),
      pdfResultPath: pdfPath,
      error: null,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await documentReference.update({
      status: DOCUMENT_STATUS.FAILED,
      error: errorMessage,
    });
    console.error(
      `Error processing generation for document ${documentId}:`,
      error
    );
  }
}

// Starts generation and returns immediately
export async function startGeneration(
  documentId: string,
  ownerId: string
): Promise<{ status: string }> {
  const database = getDb();
  const documentReference = database
    .collection(DOCUMENTS_COLLECTION_NAME)
    .doc(documentId);
  const documentSnapshot = await documentReference.get();

  if (!documentSnapshot.exists) {
    throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);
  }

  const documentData = documentSnapshot.data();
  if (!documentData || documentData.ownerId !== ownerId) {
    throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND_OR_ACCESS_DENIED);
  }

  if (documentData.status !== EXPECTED_STATUS_FOR_GENERATION) {
    const errorMessage = ERROR_MESSAGES.DOCUMENT_STATUS_INVALID.replace(
      "{status}",
      documentData.status
    );
    throw new Error(errorMessage);
  }

  await documentReference.update({
    status: DOCUMENT_STATUS.GENERATING,
    error: null,
  });

  processGeneration(
    documentId,
    documentData.resumeText,
    documentData.jobText,
    ownerId
  ).catch((error) => {
    console.error(
      `Failed to start background generation for document ${documentId}:`,
      error
    );
  });

  return { status: DOCUMENT_STATUS.GENERATING };
}
