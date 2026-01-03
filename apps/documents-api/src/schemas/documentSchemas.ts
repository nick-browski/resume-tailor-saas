import { z } from "zod";
import { resumeTextSchema, optionalJobTextSchema, firestoreIdSchema } from "./common.js";

export const createDocumentBodySchema = z.object({
  resumeText: resumeTextSchema.optional(),
  jobText: optionalJobTextSchema,
});

export const documentIdParamsSchema = z.object({
  id: firestoreIdSchema,
});

