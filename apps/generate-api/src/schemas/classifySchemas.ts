import { z } from "zod";
import { resumeTextSchema, jobTextSchema } from "./common.js";

// Schema for TAILOR mode - jobText is required
export const classifyMultipartBodySchemaForTailor = z.object({
  jobText: jobTextSchema,
  resumeText: resumeTextSchema.optional(),
});

// Schema for EDIT mode - jobText is not needed
export const classifyMultipartBodySchemaForEdit = z.object({
  resumeText: resumeTextSchema.optional(),
});
