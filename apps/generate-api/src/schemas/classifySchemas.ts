import { z } from "zod";
import { resumeTextSchema, jobTextSchema } from "./common.js";

const editPromptSchema = z
  .string()
  .min(1, "Edit prompt cannot be empty")
  .max(1000, "Edit prompt must not exceed 1000 characters")
  .refine((text) => text.trim().length > 0, {
    message: "Edit prompt cannot be empty or only whitespace",
  });

// Schema for TAILOR mode - jobText is required
export const classifyMultipartBodySchemaForTailor = z.object({
  jobText: jobTextSchema,
  resumeText: resumeTextSchema.optional(),
});

// Schema for EDIT mode - jobText is not needed, editPrompt is optional
export const classifyMultipartBodySchemaForEdit = z.object({
  resumeText: resumeTextSchema.optional(),
  editPrompt: editPromptSchema.optional(),
});
