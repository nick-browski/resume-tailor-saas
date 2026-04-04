import { z } from "zod";
import {
  resumeTextSchema,
  jobTextSchema,
  editPromptSchema,
} from "./common.js";

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
