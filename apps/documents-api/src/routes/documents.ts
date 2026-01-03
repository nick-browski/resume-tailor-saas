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
  HTTP_STATUS,
  ERROR_MESSAGES,
  DOCUMENT_STATUS,
} from "../config/constants.js";
import {
  validateFile,
  validateMultipartRequest,
  validateParams,
} from "../middleware/validation.js";
import {
  createDocumentBodySchema,
  documentIdParamsSchema,
} from "../schemas/documentSchemas.js";

export const documentsRouter: express.Router = express.Router();

const FILE_FIELD_NAME = "file";
const uploadMiddleware = multer({ storage: multer.memoryStorage() });

// Creates a new document from uploaded file or text
documentsRouter.post(
  "/",
  verifyFirebaseToken,
  uploadMiddleware.single(FILE_FIELD_NAME),
  validateFile(),
  validateMultipartRequest(createDocumentBodySchema, true),
  async (request: AuthenticatedRequest, response: express.Response) => {
    try {
      const userId = request.userId!;
      const uploadedFile = request.file;
      const resumeTextFromBody = request.body.resumeText;
      const jobTextFromBody = request.body.jobText;

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
  validateParams(documentIdParamsSchema),
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
