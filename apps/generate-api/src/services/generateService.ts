import { getDb } from "../config/firebase-admin.js";
import { generateTailoredResume } from "./openRouterService.js";
import { FIREBASE_CONFIG, DOCUMENT_STATUS, ERROR_MESSAGES } from "../config/constants.js";

const DOCUMENTS_COLLECTION_NAME = FIREBASE_CONFIG.DOCUMENTS_COLLECTION_NAME;
const EXPECTED_STATUS_FOR_GENERATION = DOCUMENT_STATUS.PARSED;

// Generates a tailored resume for a document and updates its status
export async function generateResumeForDocument(
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

  try {
    const tailoredResumeText = await generateTailoredResume(
      documentData.resumeText,
      documentData.jobText
    );

    await documentReference.update({
      status: DOCUMENT_STATUS.GENERATED,
      tailoredText: tailoredResumeText,
      error: null,
    });

    return { status: DOCUMENT_STATUS.GENERATED };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await documentReference.update({
      status: DOCUMENT_STATUS.FAILED,
      error: errorMessage,
    });
    throw error;
  }
}
