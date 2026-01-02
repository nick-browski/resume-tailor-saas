import express from "express";
import {
  verifyFirebaseToken,
  AuthenticatedRequest,
} from "../middleware/auth.js";
import {
  startGeneration,
  startParseOriginal,
} from "../services/generateService.js";
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  DOCUMENT_STATUS,
  PARSE_RESPONSE_STATUS,
} from "../config/constants.js";

export const generateRouter: express.Router = express.Router();

const handleServiceError = (
  error: unknown,
  defaultErrorMessage: string,
  response: express.Response
) => {
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
};

// Starts generation (dev: sync 200, prod: async 202)
generateRouter.post(
  "/:id/generate",
  verifyFirebaseToken,
  async (request: AuthenticatedRequest, response) => {
    try {
      const userId = request.userId!;
      const documentId = request.params.id;

      const generationResult = await startGeneration(documentId, userId);
      const statusCode =
        generationResult.status === DOCUMENT_STATUS.GENERATED
          ? HTTP_STATUS.OK
          : HTTP_STATUS.ACCEPTED;
      response.status(statusCode).json(generationResult);
    } catch (error) {
      handleServiceError(
        error,
        ERROR_MESSAGES.FAILED_TO_GENERATE_RESUME,
        response
      );
    }
  }
);

// Parses original resume (dev: sync 200, prod: async 202)
generateRouter.post(
  "/:id/parse-original",
  verifyFirebaseToken,
  async (request: AuthenticatedRequest, response) => {
    try {
      const userId = request.userId!;
      const documentId = request.params.id;

      const parseResult = await startParseOriginal(documentId, userId);

      if (parseResult.status === PARSE_RESPONSE_STATUS.CACHED) {
        response.status(HTTP_STATUS.OK).json({
          originalResumeData: parseResult.originalResumeData,
        });
        return;
      }

      const statusCode =
        parseResult.status === PARSE_RESPONSE_STATUS.PARSED
          ? HTTP_STATUS.OK
          : HTTP_STATUS.ACCEPTED;
      response.status(statusCode).json(parseResult);
    } catch (error) {
      handleServiceError(error, ERROR_MESSAGES.UNKNOWN_ERROR, response);
    }
  }
);
