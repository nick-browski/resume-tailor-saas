import { z } from "zod";
import { resumeTextSchema, jobTextSchema } from "./common.js";

export const matchMultipartBodySchema = z.object({
  jobText: jobTextSchema,
  resumeText: resumeTextSchema.optional(),
});
