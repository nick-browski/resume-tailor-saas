import { getDb, getStorage } from "../config/firebase-admin.js";
import {
  generateTailoredResume,
  parseResumeToStructure,
  editResumeWithPrompt,
  type ResumeData,
} from "./mistralService.js";
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
import { safeJsonParse } from "../utils/jsonUtils.js";
import { extractTextFromPdfBuffer } from "../utils/pdfUtils.js";

const DOCUMENTS_COLLECTION_NAME = FIREBASE_CONFIG.DOCUMENTS_COLLECTION_NAME;
const EXPECTED_STATUS_FOR_GENERATION = DOCUMENT_STATUS.PARSED;

interface DocumentAccessResult {
  documentReference: DocumentReference<DocumentData>;
  documentData: DocumentData;
}

function getDocumentReference(
  documentId: string
): DocumentReference<DocumentData> {
  const database = getDb();
  return database.collection(DOCUMENTS_COLLECTION_NAME).doc(documentId);
}

async function validateDocumentAccess(
  documentId: string,
  ownerId: string
): Promise<DocumentAccessResult> {
  const documentReference = getDocumentReference(documentId);
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
  errorLogContext: string
): Promise<void> {
  try {
    await documentReference.update({
      status: DOCUMENT_STATUS.FAILED,
      error: errorMessage,
    });
  } catch (statusUpdateError) {
    console.error(`${errorLogContext} ${documentId}:`, statusUpdateError);
  }
}

async function updateParseStatusToFailed(
  documentReference: DocumentReference<DocumentData>,
  documentId: string,
  errorLogContext: string
): Promise<void> {
  try {
    await documentReference.update({
      originalParseStatus: FIRESTORE_PARSE_STATUS.FAILED,
    });
  } catch (statusUpdateError) {
    console.error(`${errorLogContext} ${documentId}:`, statusUpdateError);
  }
}

// Processes generation (called by Cloud Tasks, always updates status to GENERATED or FAILED)
export async function processGeneration(
  documentId: string,
  resumeText: string,
  jobText: string,
  ownerId: string
): Promise<void> {
  const documentReference = getDocumentReference(documentId);

  try {
    const resumeData = await generateTailoredResume(resumeText, jobText);
    const pdfPath = await generatePDFFromResumeData(
      resumeData,
      ownerId,
      documentId
    );

    await documentReference.update({
      status: DOCUMENT_STATUS.GENERATED,
      tailoredResumeData: JSON.stringify(resumeData),
      pdfResultPath: pdfPath,
      error: null,
    });
  } catch (generationError) {
    const generationErrorMessage =
      generationError instanceof Error
        ? generationError.message
        : ERROR_MESSAGES.UNKNOWN_ERROR;

    await updateStatusToFailed(
      documentReference,
      documentId,
      generationErrorMessage,
      ERROR_MESSAGES.FAILED_TO_UPDATE_STATUS_TO_FAILED
    );

    console.error(
      `${ERROR_MESSAGES.ERROR_PROCESSING_GENERATION} ${documentId}:`,
      generationError
    );
    throw generationError;
  }
}

async function handleTaskEnqueueError(
  documentReference: DocumentReference<DocumentData>,
  documentId: string,
  taskEnqueueError: unknown
): Promise<never> {
  const enqueueErrorMessage =
    taskEnqueueError instanceof Error
      ? taskEnqueueError.message
      : ERROR_MESSAGES.FAILED_TO_ENQUEUE_GENERATION_TASK;

  await updateStatusToFailed(
    documentReference,
    documentId,
    enqueueErrorMessage,
    ERROR_MESSAGES.FAILED_TO_UPDATE_STATUS_TO_FAILED
  );

  throw taskEnqueueError;
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
    const statusErrorMessage = ERROR_MESSAGES.DOCUMENT_STATUS_INVALID.replace(
      "{status}",
      documentData.status
    );
    throw new Error(statusErrorMessage);
  }

  await documentReference.update({
    status: DOCUMENT_STATUS.GENERATING,
    error: null,
  });

  const resumeTextForGeneration = await getResumeTextForParsing(documentData);

  if (IS_DEV) {
    await processGeneration(
      documentId,
      resumeTextForGeneration,
      documentData.jobText,
      ownerId
    );
    return { status: DOCUMENT_STATUS.GENERATED };
  }

  try {
    const { createGenerationTask } = await import("./cloudTasksService.js");
    await createGenerationTask(
      documentId,
      resumeTextForGeneration,
      documentData.jobText,
      ownerId
    );
    return { status: DOCUMENT_STATUS.GENERATING };
  } catch (taskEnqueueError) {
    return handleTaskEnqueueError(
      documentReference,
      documentId,
      taskEnqueueError
    );
  }
}

// Extracts text from PDF file stored in Firebase Storage
async function extractTextFromPdfFile(pdfStoragePath: string): Promise<string> {
  const storageBucket = getStorage().bucket();
  const pdfStorageFile = storageBucket.file(pdfStoragePath);
  const [pdfFileBuffer] = await pdfStorageFile.download();
  return extractTextFromPdfBuffer(pdfFileBuffer);
}

// Processes parse original (called by Cloud Tasks, always updates Firestore)
export async function processParseOriginal(
  documentId: string,
  resumeText: string,
  ownerId: string
): Promise<void> {
  const documentReference = getDocumentReference(documentId);

  try {
    const parsedResume = await parseResumeToStructure(resumeText);
    const currentDocumentSnapshot = await documentReference.get();
    const currentDocumentData = currentDocumentSnapshot.data();

    const updateData: Record<string, unknown> = {
      originalParseStatus: FIRESTORE_PARSE_STATUS.PARSED,
      originalResumeData: JSON.stringify(parsedResume),
    };

    if (!currentDocumentData?.initialOriginalResumeData) {
      updateData.initialOriginalResumeData = JSON.stringify(parsedResume);
    }

    await documentReference.update(updateData);
  } catch (parsingError) {
    await updateParseStatusToFailed(
      documentReference,
      documentId,
      ERROR_MESSAGES.FAILED_TO_UPDATE_PARSE_STATUS_TO_FAILED
    );
    throw parsingError;
  }
}

function isJsonString(text: string | undefined): boolean {
  return !!text && typeof text === "string" && text.trim().startsWith("{");
}

async function getResumeTextForParsing(
  documentData: DocumentData
): Promise<string> {
  let resumeText = documentData.resumeText || null;

  // If resumeText is already a JSON string (parsed data), try to extract text from PDF
  if (isJsonString(resumeText) && documentData.pdfOriginalPath) {
    try {
      resumeText = await extractTextFromPdfFile(documentData.pdfOriginalPath);
    } catch (pdfExtractionError) {
      console.error("Failed to extract text from PDF:", pdfExtractionError);
      // If PDF extraction fails, throw an error instead of using JSON string
      // The JSON string is already parsed data, not raw resume text
      throw new Error(
        `${ERROR_MESSAGES.FAILED_TO_EXTRACT_TEXT_FROM_PDF}: ${
          pdfExtractionError instanceof Error
            ? pdfExtractionError.message
            : ERROR_MESSAGES.UNKNOWN_ERROR
        }`
      );
    }
  }

  if (!resumeText || resumeText.trim().length === 0) {
    throw new Error(ERROR_MESSAGES.DOCUMENT_HAS_NO_RESUME_TEXT);
  }

  return resumeText;
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

  if (documentData.initialOriginalResumeData) {
    const parsed = safeJsonParse<ResumeData>(
      documentData.initialOriginalResumeData
    );
    return {
      status: PARSE_RESPONSE_STATUS.CACHED,
      originalResumeData: parsed,
    };
  }

  // Skip parsing if both exist and resumeText is not JSON (already parsed)
  if (
    documentData.originalResumeData &&
    !isJsonString(documentData.resumeText) &&
    documentData.initialOriginalResumeData
  ) {
    const parsed = safeJsonParse<ResumeData>(documentData.originalResumeData);
    return {
      status: PARSE_RESPONSE_STATUS.CACHED,
      originalResumeData: parsed,
    };
  }

  const resumeTextForParsing = await getResumeTextForParsing(documentData);

  await documentReference.update({
    originalParseStatus: FIRESTORE_PARSE_STATUS.PARSING,
  });

  if (IS_DEV) {
    await processParseOriginal(documentId, resumeTextForParsing, ownerId);
    const updatedDocumentSnapshot = await documentReference.get();
    const updatedDocumentData = updatedDocumentSnapshot.data();

    if (updatedDocumentData?.initialOriginalResumeData) {
      return {
        status: PARSE_RESPONSE_STATUS.PARSED,
        originalResumeData: safeJsonParse<ResumeData>(
          updatedDocumentData.initialOriginalResumeData
        ),
      };
    }

    return { status: PARSE_RESPONSE_STATUS.PARSED };
  }

  const { createParseOriginalTask } = await import("./cloudTasksService.js");
  await createParseOriginalTask(documentId, resumeTextForParsing, ownerId);
  return { status: PARSE_RESPONSE_STATUS.QUEUED };
}

// Processes edit resume (called by Cloud Tasks, always updates Firestore)
export async function processEditResume(
  documentId: string,
  editPrompt: string,
  ownerId: string
): Promise<void> {
  const { documentReference, documentData } = await validateDocumentAccess(
    documentId,
    ownerId
  );

  try {
    let currentResumeData: ResumeData;

    if (documentData.originalResumeData) {
      currentResumeData = safeJsonParse<ResumeData>(
        documentData.originalResumeData
      );
    } else {
      const resumeTextForParsing = await getResumeTextForParsing(documentData);
      currentResumeData = await parseResumeToStructure(resumeTextForParsing);
    }

    // Edit resume with prompt
    const editedResumeData = await editResumeWithPrompt(
      currentResumeData,
      editPrompt
    );

    // Generate PDF from edited resume data
    const pdfPath = await generatePDFFromResumeData(
      editedResumeData,
      ownerId,
      documentId
    );

    // Save to both fields: originalResumeData (current state) and tailoredResumeData (for DIFF)
    await documentReference.update({
      originalResumeData: JSON.stringify(editedResumeData),
      tailoredResumeData: JSON.stringify(editedResumeData),
      pdfResultPath: pdfPath,
      status: DOCUMENT_STATUS.GENERATED,
      error: null,
    });
  } catch (editingError) {
    const editingErrorMessage =
      editingError instanceof Error
        ? editingError.message
        : ERROR_MESSAGES.UNKNOWN_ERROR;

    await updateStatusToFailed(
      documentReference,
      documentId,
      editingErrorMessage,
      ERROR_MESSAGES.FAILED_TO_UPDATE_STATUS_TO_FAILED
    );

    console.error(
      `Error processing edit resume for document ${documentId}:`,
      editingError
    );
    throw editingError;
  }
}

// Starts edit resume (dev: sync, prod: enqueue task)
export async function startEditResume(
  documentId: string,
  editPrompt: string,
  ownerId: string
): Promise<{ status: string }> {
  const { documentReference } = await validateDocumentAccess(
    documentId,
    ownerId
  );

  // Update status to indicate editing is in progress
  await documentReference.update({
    status: DOCUMENT_STATUS.GENERATING,
    error: null,
  });

  if (IS_DEV) {
    await processEditResume(documentId, editPrompt, ownerId);
    return { status: DOCUMENT_STATUS.PARSED };
  }

  try {
    const { createEditResumeTask } = await import("./cloudTasksService.js");
    await createEditResumeTask(documentId, editPrompt, ownerId);
    return { status: DOCUMENT_STATUS.GENERATING };
  } catch (taskEnqueueError) {
    return handleTaskEnqueueError(
      documentReference,
      documentId,
      taskEnqueueError
    );
  }
}
