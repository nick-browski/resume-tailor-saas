import { z } from "zod";
import { resumeTextSchema, jobTextSchema, firestoreIdSchema } from "./common.js";

export const processGenerationTaskSchema = z.object({
  documentId: firestoreIdSchema,
  resumeText: resumeTextSchema,
  jobText: jobTextSchema,
  ownerId: firestoreIdSchema,
});

export const processParseOriginalTaskSchema = z.object({
  documentId: firestoreIdSchema,
  resumeText: resumeTextSchema,
  ownerId: firestoreIdSchema,
});

