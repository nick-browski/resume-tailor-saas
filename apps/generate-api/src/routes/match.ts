import express from "express";
import multer from "multer";
import {
  verifyFirebaseToken,
  AuthenticatedRequest,
} from "../middleware/auth.js";
import { checkResumeJobMatch } from "../services/matchService.js";
import { HTTP_STATUS } from "../config/constants.js";
import { handleServiceError } from "../utils/errorHandler.js";
import { validateFile } from "../middleware/validation.js";
import { matchMultipartBodySchema } from "../schemas/matchSchemas.js";
import {
  extractResumeTextFromRequest,
  createResponseWithExtractedText,
} from "../utils/requestUtils.js";
import { validateMultipartRequest } from "../utils/validationUtils.js";

export const matchRouter: express.Router = express.Router();

const FILE_FIELD_NAME = "file";
const uploadMiddleware = multer({ storage: multer.memoryStorage() });

matchRouter.post(
  "/",
  verifyFirebaseToken,
  uploadMiddleware.single(FILE_FIELD_NAME),
  validateFile(),
  validateMultipartRequest(matchMultipartBodySchema, true),
  async (request: AuthenticatedRequest, response) => {
    try {
      const extractedResumeText = await extractResumeTextFromRequest(request);
      const jobDescriptionText = request.body.jobText;

      const matchAnalysisResult = await checkResumeJobMatch(
        extractedResumeText,
        jobDescriptionText
      );

      const responseData = createResponseWithExtractedText(
        matchAnalysisResult,
        extractedResumeText,
        !!request.file
      );

      response.status(HTTP_STATUS.OK).json(responseData);
    } catch (matchCheckError) {
      handleServiceError(
        matchCheckError,
        "Failed to check resume and job description match",
        response
      );
    }
  }
);
