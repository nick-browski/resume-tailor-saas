import { z } from "zod";
import { firestoreIdSchema } from "./common.js";

export const editResumeBodySchema = z.object({
  prompt: z
    .string()
    .min(1, "Edit prompt cannot be empty")
    .max(1000, "Edit prompt must not exceed 1000 characters"),
});

export const editResumeParamsSchema = z.object({
  id: firestoreIdSchema,
});

