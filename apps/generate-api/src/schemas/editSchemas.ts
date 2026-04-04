import { z } from "zod";
import { editPromptSchema, firestoreIdSchema } from "./common.js";

export const editResumeBodySchema = z.object({
  prompt: editPromptSchema,
});

export const editResumeParamsSchema = z.object({
  id: firestoreIdSchema,
});

