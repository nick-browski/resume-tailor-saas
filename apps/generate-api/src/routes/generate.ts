import express from "express";
import {
  verifyFirebaseToken,
  AuthenticatedRequest,
} from "../middleware/auth.js";
import { startGeneration } from "../services/generateService.js";
import { parseResumeToStructure } from "../services/openRouterService.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.js";
import { getDb } from "../config/firebase-admin.js";
import { FIREBASE_CONFIG } from "../config/constants.js";

export const generateRouter: express.Router = express.Router();

// Starts generation process and returns immediately
generateRouter.post(
  "/:id/generate",
  verifyFirebaseToken,
  async (request: AuthenticatedRequest, response) => {
    try {
      const userId = request.userId!;
      const documentId = request.params.id;

      const generationResult = await startGeneration(documentId, userId);

      response.json(generationResult);
    } catch (error) {
      console.error("Error starting generation:", error);
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

// Parses original resume into structured JSON format
generateRouter.post(
  "/:id/parse-original",
  verifyFirebaseToken,
  async (request: AuthenticatedRequest, response) => {
    try {
      const userId = request.userId!;
      const documentId = request.params.id;
      const database = getDb();
      const documentReference = database
        .collection(FIREBASE_CONFIG.DOCUMENTS_COLLECTION_NAME)
        .doc(documentId);
      const documentSnapshot = await documentReference.get();

      if (!documentSnapshot.exists) {
        response.status(HTTP_STATUS.NOT_FOUND).json({
          error: ERROR_MESSAGES.DOCUMENT_NOT_FOUND,
        });
        return;
      }

      const documentData = documentSnapshot.data();
      if (!documentData || documentData.ownerId !== userId) {
        response.status(HTTP_STATUS.NOT_FOUND).json({
          error: ERROR_MESSAGES.DOCUMENT_NOT_FOUND_OR_ACCESS_DENIED,
        });
        return;
      }

      // Return cached result if available
      if (documentData.originalResumeData) {
        response.status(HTTP_STATUS.OK).json({
          originalResumeData: JSON.parse(documentData.originalResumeData),
        });
        return;
      }

      // Parse resume
      const parsedResume = await parseResumeToStructure(
        documentData.resumeText
      );

      // Save result in document for caching
      await documentReference.update({
        originalResumeData: JSON.stringify(parsedResume),
      });

      response.status(HTTP_STATUS.OK).json({
        originalResumeData: parsedResume,
      });
    } catch (error) {
      console.error("Error parsing original resume:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: `Failed to parse original resume: ${errorMessage}`,
      });
    }
  }
);
