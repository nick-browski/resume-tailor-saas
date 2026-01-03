import express from "express";
import { z, ZodSchema } from "zod";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.js";

export function createTaskHandler<T extends ZodSchema>(
  schema: T,
  processTask: (body: z.infer<T>) => Promise<void>,
  errorContext: string
) {
  return async (request: express.Request, response: express.Response) => {
    try {
      const validatedBody = schema.parse(request.body);
      await processTask(validatedBody);
      response.status(HTTP_STATUS.OK).json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        response.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "Validation failed",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
        return;
      }

      console.error(`Error processing ${errorContext}:`, error);
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: errorMessage,
      });
    }
  };
}
