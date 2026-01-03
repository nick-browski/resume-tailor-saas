import { z } from "zod";
import { resumeTextSchema, jobTextSchema } from "./common.js";

export const classifyMultipartBodySchema = z.object({
  jobText: jobTextSchema,
  resumeText: resumeTextSchema.optional(),
});

export const classifyJsonBodySchema = z.object({
  resumeText: resumeTextSchema.optional(),
  jobText: jobTextSchema,
});

