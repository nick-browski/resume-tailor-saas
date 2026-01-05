import { z } from "zod";
import {
  resumeTextSchema,
  optionalJobTextSchema,
  firestoreIdSchema,
  matchCheckResultSchema,
} from "./common.js";

export const createDocumentBodySchema = z.object({
  resumeText: resumeTextSchema.optional(),
  jobText: optionalJobTextSchema,
  matchCheckResult: matchCheckResultSchema,
});

export const documentIdParamsSchema = z.object({
  id: firestoreIdSchema,
});

