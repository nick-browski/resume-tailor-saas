import express from "express";
import multer from "multer";
import {
  verifyFirebaseToken,
  AuthenticatedRequest,
} from "../middleware/auth.js";
import {
  createDocument,
  getDocumentById,
  getAllDocuments,
} from "../services/documentService.js";
import {
  initializeFirebaseAdmin,
  getStorage,
} from "../config/firebase-admin.js";
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  DOCUMENT_STATUS,
  STORAGE_CONFIG,
  STORAGE_ERROR_PATTERNS,
} from "../config/constants.js";

initializeFirebaseAdmin();

const FILE_FIELD_NAME = "file";
const uploadMiddleware = multer({ storage: multer.memoryStorage() });
export const documentsRouter: express.Router = express.Router();

// Creates a new document from uploaded file or text
documentsRouter.post(
  "/",
  verifyFirebaseToken,
  uploadMiddleware.single(FILE_FIELD_NAME),
  async (request: AuthenticatedRequest, response: express.Response) => {
    try {
      const userId = request.userId!;
      const uploadedFile = request.file;
      const resumeTextFromBody = request.body.resumeText;
      const jobTextFromBody = request.body.jobText;

      if (!uploadedFile && !resumeTextFromBody) {
        response.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.FILE_OR_TEXT_REQUIRED,
        });
        return;
      }

      const createdDocumentId = await createDocument(
        userId,
        resumeTextFromBody || "",
        jobTextFromBody,
        uploadedFile?.buffer,
        uploadedFile?.originalname
      );

      response.status(HTTP_STATUS.CREATED).json({
        id: createdDocumentId,
        status: DOCUMENT_STATUS.PARSED,
      });
    } catch (error) {
      console.error("Error creating document:", error);
      response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.FAILED_TO_CREATE_DOCUMENT,
      });
    }
  }
);

// Retrieves all documents for the authenticated user
documentsRouter.get(
  "/",
  verifyFirebaseToken,
  async (request: AuthenticatedRequest, response) => {
    try {
      const userId = request.userId!;
      const userDocuments = await getAllDocuments(userId);
      response.json(userDocuments);
    } catch (error) {
      console.error("Error fetching documents:", error);
      response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.FAILED_TO_FETCH_DOCUMENTS,
      });
    }
  }
);

// Retrieves a specific document by ID if it belongs to the authenticated user
documentsRouter.get(
  "/:id",
  verifyFirebaseToken,
  async (request: AuthenticatedRequest, response) => {
    try {
      const authenticatedUserId = request.userId!;
      const requestedDocumentId = request.params.id;
      const foundDocument = await getDocumentById(
        requestedDocumentId,
        authenticatedUserId
      );

      if (!foundDocument) {
        response.status(HTTP_STATUS.NOT_FOUND).json({
          error: ERROR_MESSAGES.DOCUMENT_NOT_FOUND,
        });
        return;
      }

      response.json(foundDocument);
    } catch (fetchError) {
      console.error("Error fetching document:", fetchError);
      response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.FAILED_TO_FETCH_DOCUMENT,
      });
    }
  }
);

// Downloads PDF file for a specific document
documentsRouter.get(
  "/:id/pdf",
  verifyFirebaseToken,
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
