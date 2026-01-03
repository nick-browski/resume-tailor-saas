import express from "express";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.js";

export function createTaskHandler(
  validateFields: (body: any) => string | null,
  processTask: (body: any) => Promise<void>,
  errorContext: string
) {
  return async (request: express.Request, response: express.Response) => {
    try {
      const validationError = validateFields(request.body);
      if (validationError) {
        response.status(HTTP_STATUS.BAD_REQUEST).json({
          error: validationError,
        });
        return;
      }

      await processTask(request.body);
      response.status(HTTP_STATUS.OK).json({ success: true });
    } catch (taskError) {
      console.error(`Error processing ${errorContext}:`, taskError);
      const errorMessage =
        taskError instanceof Error
          ? taskError.message
          : ERROR_MESSAGES.UNKNOWN_ERROR;
      response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: errorMessage,
      });
    }
  };
}

