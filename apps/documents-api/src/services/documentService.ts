import { getDb, getStorage } from "../config/firebase-admin.js";
import type { Document, MatchCheckResult } from "../types/document.js";
import type { Timestamp } from "firebase-admin/firestore";
import { Timestamp as FirestoreTimestamp } from "firebase-admin/firestore";
import { FIREBASE_CONFIG, STORAGE_CONFIG } from "../config/constants.js";

const DOCUMENTS_COLLECTION_NAME = FIREBASE_CONFIG.DOCUMENTS_COLLECTION_NAME;
const EMPTY_STRING = "";
const DEFAULT_JOB_TEXT = EMPTY_STRING;
const DEFAULT_PDF_PATH = EMPTY_STRING;
const TTL_EXPIRY_MS = 2 * 60 * 60 * 1000; // TTL: 2 hours

// Creates a new document with resume text and optional PDF file
export async function createDocument(
  ownerId: string,
  resumeText: string,
  jobText?: string,
  pdfBuffer?: Buffer,
  pdfFileName?: string,
  matchCheckResult?: MatchCheckResult | null
): Promise<string> {
  const database = getDb();
  const storage = getStorage();

  let finalResumeText = resumeText;
  let originalPdfPath: string | null = null;

  if (pdfBuffer && pdfFileName) {
    // Save file to Storage for archiving
    const storageBucket = storage.bucket();
    const timestamp = Date.now();
    const storageFilePath = `${STORAGE_CONFIG.RESUMES_FOLDER}/${ownerId}/${timestamp}-${pdfFileName}`;
    const storageFile = storageBucket.file(storageFilePath);

    await storageFile.save(pdfBuffer, {
      contentType: STORAGE_CONFIG.PDF_CONTENT_TYPE,
    });
    originalPdfPath = storageFile.name;
  }

  // Check if running in emulator mode (TTL not supported in emulator)
  const isEmulatorMode =
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.FIREBASE_STORAGE_EMULATOR_HOST;

  const documentData: Record<string, unknown> = {
    ownerId,
    jobText: jobText || DEFAULT_JOB_TEXT,
    resumeText: finalResumeText,
    originalResumeData: null,
    tailoredText: null,
    tailoredResumeData: null,
    status: "parsed" as const,
    pdfOriginalPath: originalPdfPath || DEFAULT_PDF_PATH,
    pdfResultPath: null,
    createdAt: new Date(),
    error: null,
    matchCheckResult: matchCheckResult || null,
  };

  // Only add expireAt in production (TTL not supported in emulator)
  if (!isEmulatorMode) {
    const expireAtDate = new Date(Date.now() + TTL_EXPIRY_MS);
    documentData.expireAt = FirestoreTimestamp.fromDate(expireAtDate);
  }

  const documentReference = await database
    .collection(DOCUMENTS_COLLECTION_NAME)
    .add(documentData);

  return documentReference.id;
}

// Retrieves a document by ID if it belongs to the owner
export async function getDocumentById(
  documentId: string,
  ownerId: string
): Promise<Document | null> {
  const database = getDb();
  const documentReference = database
    .collection(DOCUMENTS_COLLECTION_NAME)
    .doc(documentId);
  const documentSnapshot = await documentReference.get();

  if (!documentSnapshot.exists) {
    return null;
  }

  const documentData = documentSnapshot.data();
  if (!documentData || documentData.ownerId !== ownerId) {
    return null;
  }

  const createdAtTimestamp = documentData.createdAt as Timestamp;
  return {
    id: documentSnapshot.id,
    ownerId: documentData.ownerId,
    jobText: documentData.jobText,
    resumeText: documentData.resumeText,
    initialOriginalResumeData: documentData.initialOriginalResumeData || null,
    originalResumeData: documentData.originalResumeData || null,
    tailoredText: documentData.tailoredText,
    tailoredResumeData: documentData.tailoredResumeData || null,
    status: documentData.status,
    pdfOriginalPath: documentData.pdfOriginalPath,
    pdfResultPath: documentData.pdfResultPath,
    createdAt: createdAtTimestamp.toDate().toISOString(),
    error: documentData.error,
    matchCheckResult: documentData.matchCheckResult || null,
  };
}

// Retrieves all documents for a specific owner, ordered by creation date
export async function getAllDocuments(ownerId: string): Promise<Document[]> {
  const database = getDb();
  const documentsSnapshot = await database
    .collection(DOCUMENTS_COLLECTION_NAME)
    .where("ownerId", "==", ownerId)
    .orderBy("createdAt", "desc")
    .get();

  return documentsSnapshot.docs.map((documentSnapshot) => {
    const documentData = documentSnapshot.data();
    const createdAtTimestamp = documentData.createdAt as Timestamp;
    return {
      id: documentSnapshot.id,
      ownerId: documentData.ownerId,
      jobText: documentData.jobText,
      resumeText: documentData.resumeText,
      initialOriginalResumeData: documentData.initialOriginalResumeData || null,
      originalResumeData: documentData.originalResumeData || null,
      tailoredText: documentData.tailoredText,
      tailoredResumeData: documentData.tailoredResumeData || null,
      status: documentData.status,
      pdfOriginalPath: documentData.pdfOriginalPath,
      pdfResultPath: documentData.pdfResultPath,
      createdAt: createdAtTimestamp.toDate().toISOString(),
      error: documentData.error,
      matchCheckResult: documentData.matchCheckResult || null,
    };
  });
}
