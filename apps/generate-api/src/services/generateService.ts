import { getDb } from "../config/firebase-admin.js";
import {
  generateTailoredResume,
  parseResumeToStructure,
  type ResumeData,
} from "./openRouterService.js";
import { generatePDFFromResumeData } from "./pdfService.js";
import {
  FIREBASE_CONFIG,
  DOCUMENT_STATUS,
  ERROR_MESSAGES,
  IS_DEV,
  FIRESTORE_PARSE_STATUS,
  PARSE_RESPONSE_STATUS,
} from "../config/constants.js";
import type { DocumentReference, DocumentData } from "firebase-admin/firestore";

const DOCUMENTS_COLLECTION_NAME = FIREBASE_CONFIG.DOCUMENTS_COLLECTION_NAME;
const EXPECTED_STATUS_FOR_GENERATION = DOCUMENT_STATUS.PARSED;

interface DocumentAccessResult {
  documentReference: DocumentReference<DocumentData>;
  documentData: DocumentData;
}

async function validateDocumentAccess(
  documentId: string,
  ownerId: string
): Promise<DocumentAccessResult> {
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

  return {
    documentReference,
    documentData,
  };
}

async function updateStatusToFailed(
  documentReference: DocumentReference<DocumentData>,
  documentId: string,
  errorMessage: string,
  errorLogMessage: string
): Promise<void> {
  try {
    await documentReference.update({
      status: DOCUMENT_STATUS.FAILED,
      error: errorMessage,
    });
  } catch (updateError) {
    console.error(`${errorLogMessage} ${documentId}:`, updateError);
  }
}

async function updateParseStatusToFailed(
  documentReference: DocumentReference<DocumentData>,
  documentId: string,
  errorLogMessage: string
): Promise<void> {
  try {
    await documentReference.update({
      originalParseStatus: FIRESTORE_PARSE_STATUS.FAILED,
    });
  } catch (updateError) {
    console.error(`${errorLogMessage} ${documentId}:`, updateError);
  }
}

// Processes generation (called by Cloud Tasks, always updates status to GENERATED or FAILED)
export async function processGeneration(
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
    const resumeData = await generateTailoredResume(resumeText, jobText);
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
  } catch (generationError) {
    const errorMessage =
      generationError instanceof Error
        ? generationError.message
        : ERROR_MESSAGES.UNKNOWN_ERROR;

    await updateStatusToFailed(
      documentReference,
      documentId,
      errorMessage,
      ERROR_MESSAGES.FAILED_TO_UPDATE_STATUS_TO_FAILED
    );

    console.error(
      `${ERROR_MESSAGES.ERROR_PROCESSING_GENERATION} ${documentId}:`,
      generationError
    );
    throw generationError;
  }
}

// Starts generation (dev: sync, prod: enqueue task)
export async function startGeneration(
  documentId: string,
  ownerId: string
): Promise<{ status: string }> {
  const { documentReference, documentData } = await validateDocumentAccess(
    documentId,
    ownerId
  );

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

  if (IS_DEV) {
    await processGeneration(
      documentId,
      documentData.resumeText,
      documentData.jobText,
      ownerId
    );
    return { status: DOCUMENT_STATUS.GENERATED };
  }

  try {
    const { createGenerationTask } = await import("./cloudTasksService.js");
    await createGenerationTask(
      documentId,
      documentData.resumeText,
      documentData.jobText,
      ownerId
    );
    return { status: DOCUMENT_STATUS.GENERATING };
  } catch (enqueueError) {
    // Set status to FAILED if enqueue fails (prevent stuck document)
    const errorMessage =
      enqueueError instanceof Error
        ? enqueueError.message
        : ERROR_MESSAGES.FAILED_TO_ENQUEUE_GENERATION_TASK;

    await updateStatusToFailed(
      documentReference,
      documentId,
      errorMessage,
      ERROR_MESSAGES.FAILED_TO_UPDATE_STATUS_TO_FAILED
    );

    throw enqueueError;
  }
}

// Processes parse original (called by Cloud Tasks, always updates Firestore)
export async function processParseOriginal(
  documentId: string,
  resumeText: string,
  ownerId: string
): Promise<void> {
  const database = getDb();
  const documentReference = database
    .collection(DOCUMENTS_COLLECTION_NAME)
    .doc(documentId);

  try {
    const parsedResume = await parseResumeToStructure(resumeText);
    await documentReference.update({
      originalResumeData: JSON.stringify(parsedResume),
      originalParseStatus: FIRESTORE_PARSE_STATUS.PARSED,
    });
  } catch (parseError) {
    console.error(
      `${ERROR_MESSAGES.ERROR_PARSING_ORIGINAL_RESUME} ${documentId}:`,
      parseError
    );

    await updateParseStatusToFailed(
      documentReference,
      documentId,
      ERROR_MESSAGES.FAILED_TO_UPDATE_PARSE_STATUS_TO_FAILED
    );

    throw parseError;
  }
}

// Starts parse original (dev: sync, prod: enqueue task)
export async function startParseOriginal(
  documentId: string,
  ownerId: string
): Promise<{ status: string; originalResumeData?: ResumeData }> {
  const { documentReference, documentData } = await validateDocumentAccess(
    documentId,
    ownerId
  );

  if (documentData.originalResumeData) {
    return {
      status: PARSE_RESPONSE_STATUS.CACHED,
      originalResumeData: JSON.parse(documentData.originalResumeData),
    };
  }

  if (!documentData.resumeText) {
    throw new Error(ERROR_MESSAGES.DOCUMENT_HAS_NO_RESUME_TEXT);
  }

  // Update status BEFORE starting work (same in dev and prod)
  await documentReference.update({
    originalParseStatus: FIRESTORE_PARSE_STATUS.PARSING,
  });

  if (IS_DEV) {
    await processParseOriginal(documentId, documentData.resumeText, ownerId);
    return { status: PARSE_RESPONSE_STATUS.PARSED };
  }

  const { createParseOriginalTask } = await import("./cloudTasksService.js");
  await createParseOriginalTask(documentId, documentData.resumeText, ownerId);
  return { status: PARSE_RESPONSE_STATUS.QUEUED };
}
