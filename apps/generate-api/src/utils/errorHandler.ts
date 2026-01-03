import express from "express";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.js";

export function handleServiceError(
  error: unknown,
  defaultErrorMessage: string,
  response: express.Response
): void {
  console.error("Service error:", error);
  const errorMessage =
    error instanceof Error ? error.message : defaultErrorMessage;
  const isNotFoundError =
    errorMessage === ERROR_MESSAGES.DOCUMENT_NOT_FOUND ||
    errorMessage === ERROR_MESSAGES.DOCUMENT_NOT_FOUND_OR_ACCESS_DENIED;
  const statusCode = isNotFoundError
    ? HTTP_STATUS.NOT_FOUND
    : HTTP_STATUS.INTERNAL_SERVER_ERROR;
  response.status(statusCode).json({ error: errorMessage });
}

