import express from "express";
import {
  verifyFirebaseToken,
  AuthenticatedRequest,
} from "../middleware/auth.js";
import { generateResumeForDocument } from "../services/generateService.js";
import { initializeFirebaseAdmin } from "../config/firebase-admin.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.js";

initializeFirebaseAdmin();

export const generateRouter = express.Router();

// Generates a tailored resume for a specific document
generateRouter.post(
  "/:id/generate",
  verifyFirebaseToken,
  async (request: AuthenticatedRequest, response) => {
    try {
      const userId = request.userId!;
      const documentId = request.params.id;

      const generationResult = await generateResumeForDocument(
        documentId,
        userId
      );

      response.json(generationResult);
    } catch (error) {
      console.error("Error generating resume:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : ERROR_MESSAGES.FAILED_TO_GENERATE_RESUME;
      const isNotFoundError =
        errorMessage === ERROR_MESSAGES.DOCUMENT_NOT_FOUND ||
        errorMessage === ERROR_MESSAGES.DOCUMENT_NOT_FOUND_OR_ACCESS_DENIED;
      const statusCode = isNotFoundError
        ? HTTP_STATUS.NOT_FOUND
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      response.status(statusCode).json({
        error: errorMessage,
      });
    }
  }
);
