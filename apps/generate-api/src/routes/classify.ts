import express from "express";
import multer from "multer";
import {
  verifyFirebaseToken,
  AuthenticatedRequest,
} from "../middleware/auth.js";
import {
  classifyContent,
  ClassificationMode,
} from "../services/classificationService.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.js";
import { handleServiceError } from "../utils/errorHandler.js";
import { validateFile } from "../middleware/validation.js";
import {
  classifyMultipartBodySchemaForTailor,
  classifyMultipartBodySchemaForEdit,
} from "../schemas/classifySchemas.js";
import {
  extractResumeTextFromRequest,
  createResponseWithExtractedText,
} from "../utils/requestUtils.js";
import { validateMultipartRequest } from "../utils/validationUtils.js";

export const classifyRouter: express.Router = express.Router();

const FILE_FIELD_NAME = "file";
const uploadMiddleware = multer({ storage: multer.memoryStorage() });

function getClassificationMode(
  modeParam: string | undefined
): ClassificationMode {
  return modeParam === ClassificationMode.EDIT
    ? ClassificationMode.EDIT
    : ClassificationMode.TAILOR;
}

classifyRouter.post(
  "/",
  verifyFirebaseToken,
  uploadMiddleware.single(FILE_FIELD_NAME),
  validateFile(),
  (request: AuthenticatedRequest, response, next) => {
    const mode = getClassificationMode(request.query.mode as string);
    const schema =
      mode === ClassificationMode.EDIT
        ? classifyMultipartBodySchemaForEdit
        : classifyMultipartBodySchemaForTailor;
    return validateMultipartRequest(schema, true)(request, response, next);
  },
  async (request: AuthenticatedRequest, response) => {
    try {
      const jobTextFromRequest = request.body.jobText;
      const classificationMode = getClassificationMode(
        request.query.mode as string
      );
      const extractedResumeText = await extractResumeTextFromRequest(request);
      const jobDescriptionText = jobTextFromRequest || "";

      const classificationResult = await classifyContent(
        extractedResumeText,
        jobDescriptionText,
        classificationMode
      );

      const responseData = createResponseWithExtractedText(
        classificationResult,
        extractedResumeText,
        !!request.file
      );

      response.status(HTTP_STATUS.OK).json(responseData);
    } catch (error) {
      handleServiceError(
        error,
        ERROR_MESSAGES.FAILED_TO_CLASSIFY_CONTENT,
        response
      );
    }
  }
);
