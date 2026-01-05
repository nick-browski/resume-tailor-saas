import type { DocumentSnapshot, DocumentData } from "firebase/firestore";
import type { Document } from "./types";

// Converts Firestore snapshot to Document type
export function convertFirestoreSnapshotToDocument(
  snapshot: DocumentSnapshot<DocumentData>
): Document {
  const data = snapshot.data()!;

  return {
    id: snapshot.id,
    ownerId: data.ownerId,
    jobText: data.jobText || "",
    resumeText: data.resumeText || "",
    initialOriginalResumeData: data.initialOriginalResumeData || null,
    originalResumeData: data.originalResumeData || null,
    originalParseStatus: data.originalParseStatus || null,
    tailoredText: data.tailoredText || null,
    tailoredResumeData: data.tailoredResumeData || null,
    status: data.status,
    pdfOriginalPath: data.pdfOriginalPath || "",
    pdfResultPath: data.pdfResultPath || null,
    createdAt:
      data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
    error: data.error || null,
    matchCheckResult: data.matchCheckResult || null,
  };
}
