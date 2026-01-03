import express from "express";
import multer from "multer";
import {
  verifyFirebaseToken,
  AuthenticatedRequest,
} from "../middleware/auth.js";
import { classifyContent } from "../services/classificationService.js";
import { HTTP_STATUS } from "../config/constants.js";
import { handleServiceError } from "../utils/errorHandler.js";
import {
  validateFile,
  validateMultipartRequest,
} from "../middleware/validation.js";
import { classifyMultipartBodySchema } from "../schemas/classifySchemas.js";
// @ts-expect-error - pdf-parse doesn't have types
import pdfParse from "pdf-parse";

export const classifyRouter: express.Router = express.Router();

const FILE_FIELD_NAME = "file";
const uploadMiddleware = multer({ storage: multer.memoryStorage() });

classifyRouter.post(
  "/",
  verifyFirebaseToken,
  uploadMiddleware.single(FILE_FIELD_NAME),
  validateFile(),
  validateMultipartRequest(classifyMultipartBodySchema, true),
  async (request: AuthenticatedRequest, response) => {
    try {
      const uploadedFile = request.file;
      const resumeTextFromBody = request.body.resumeText;
      const jobText = request.body.jobText;

      let resumeText: string;

      if (uploadedFile) {
        const parsedPdfData = await pdfParse(uploadedFile.buffer);
        resumeText = parsedPdfData.text;
      } else {
        resumeText = resumeTextFromBody!;
      }

      const classificationResult = await classifyContent(resumeText, jobText);

      const responseData = {
        ...classificationResult,
        extractedResumeText: uploadedFile ? resumeText : undefined,
      };

      response.status(HTTP_STATUS.OK).json(responseData);
    } catch (error) {
      handleServiceError(error, "Failed to classify content", response);
    }
  }
);
