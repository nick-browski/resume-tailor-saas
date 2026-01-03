import { z } from "zod";
import { firestoreIdSchema } from "./common.js";

export const documentIdParamsSchema = z.object({
  id: firestoreIdSchema,
});

