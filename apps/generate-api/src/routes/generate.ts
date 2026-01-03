import express from "express";
import {
  verifyFirebaseToken,
  AuthenticatedRequest,
} from "../middleware/auth.js";
import {
  startGeneration,
  startParseOriginal,
  startEditResume,
} from "../services/generateService.js";
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  DOCUMENT_STATUS,
  PARSE_RESPONSE_STATUS,
} from "../config/constants.js";
import { handleServiceError } from "../utils/errorHandler.js";
import { validateParams, validateRequest } from "../middleware/validation.js";
import { documentIdParamsSchema } from "../schemas/generateSchemas.js";
import {
  editResumeBodySchema,
  editResumeParamsSchema,
} from "../schemas/editSchemas.js";

export const generateRouter: express.Router = express.Router();

function getStatusCode(status: string): number {
  return status === DOCUMENT_STATUS.GENERATED ||
    status === DOCUMENT_STATUS.PARSED
    ? HTTP_STATUS.OK
    : HTTP_STATUS.ACCEPTED;
}

// Starts generation (dev: sync 200, prod: async 202)
generateRouter.post(
  "/:id/generate",
  verifyFirebaseToken,
  validateParams(documentIdParamsSchema),
  async (request: AuthenticatedRequest, response) => {
    try {
      const userId = request.userId!;
      const documentId = request.params.id;

      const generationResult = await startGeneration(documentId, userId);
      const httpStatusCode = getStatusCode(generationResult.status);
      response.status(httpStatusCode).json(generationResult);
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
  validateParams(documentIdParamsSchema),
  async (request: AuthenticatedRequest, response) => {
    try {
      const userId = request.userId!;
      const documentId = request.params.id;

      const parseResult = await startParseOriginal(documentId, userId);

      if (
        parseResult.status === PARSE_RESPONSE_STATUS.CACHED ||
        parseResult.status === PARSE_RESPONSE_STATUS.PARSED
      ) {
        if (parseResult.originalResumeData) {
          response.status(HTTP_STATUS.OK).json({
            originalResumeData: parseResult.originalResumeData,
          });
          return;
        }
      }

      response.status(getStatusCode(parseResult.status)).json(parseResult);
    } catch (error) {
      handleServiceError(error, ERROR_MESSAGES.UNKNOWN_ERROR, response);
    }
  }
);

// Starts edit resume (dev: sync 200, prod: async 202)
generateRouter.post(
  "/:id/edit",
  verifyFirebaseToken,
  validateParams(editResumeParamsSchema),
  validateRequest(editResumeBodySchema),
  async (request: AuthenticatedRequest, response) => {
    try {
      const userId = request.userId!;
      const documentId = request.params.id;
      const editPrompt = request.body.prompt;

      const editResult = await startEditResume(documentId, editPrompt, userId);
      response.status(getStatusCode(editResult.status)).json(editResult);
    } catch (error) {
      handleServiceError(error, ERROR_MESSAGES.FAILED_TO_EDIT_RESUME, response);
    }
  }
);
