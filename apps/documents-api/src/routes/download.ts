import express from "express";
import {
  verifyFirebaseToken,
  AuthenticatedRequest,
} from "../middleware/auth.js";
import { getDocumentById } from "../services/documentService.js";
import { getStorage } from "../config/firebase-admin.js";
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  STORAGE_CONFIG,
  STORAGE_ERROR_PATTERNS,
} from "../config/constants.js";
import { validateParams } from "../middleware/validation.js";
import { documentIdParamsSchema } from "../schemas/documentSchemas.js";

export const downloadRouter: express.Router = express.Router();

// Downloads PDF file for a specific document
downloadRouter.get(
  "/:id/pdf",
  verifyFirebaseToken,
  validateParams(documentIdParamsSchema),
  async (request: AuthenticatedRequest, response: express.Response) => {
    try {
      const authenticatedUserId = request.userId!;
      const requestedDocumentId = request.params.id;
      const foundDocument = await getDocumentById(
        requestedDocumentId,
        authenticatedUserId
      );

      if (!foundDocument?.pdfResultPath) {
        response.status(HTTP_STATUS.NOT_FOUND).json({
          error: ERROR_MESSAGES.DOCUMENT_NOT_FOUND,
        });
        return;
      }

      const storageBucket = getStorage().bucket();
      const pdfStorageFile = storageBucket.file(foundDocument.pdfResultPath);
      const [pdfFileBuffer] = await pdfStorageFile.download();

      response.setHeader("Content-Type", STORAGE_CONFIG.PDF_CONTENT_TYPE);
      response.setHeader(
        "Content-Disposition",
        `${STORAGE_CONFIG.PDF_CONTENT_DISPOSITION_ATTACHMENT}; filename="${STORAGE_CONFIG.PDF_DOWNLOAD_FILENAME}"`
      );
      response.send(pdfFileBuffer);
    } catch (downloadError) {
      console.error("Error downloading PDF:", downloadError);

      // Handle file not found errors from Storage
      if (
        downloadError instanceof Error &&
        (downloadError.message.includes(
          STORAGE_ERROR_PATTERNS.FILE_DOES_NOT_EXIST
        ) ||
          downloadError.message.includes(STORAGE_ERROR_PATTERNS.NO_SUCH_OBJECT))
      ) {
        response.status(HTTP_STATUS.NOT_FOUND).json({
          error: ERROR_MESSAGES.PDF_FILE_NOT_FOUND,
        });
        return;
      }

      response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.FAILED_TO_DOWNLOAD_PDF,
      });
    }
  }
);

