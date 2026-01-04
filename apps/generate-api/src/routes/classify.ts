import express, { Response, NextFunction } from "express";
import multer from "multer";
import { z } from "zod";
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
import { extractTextFromPdfBuffer } from "../utils/pdfUtils.js";

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

function validateClassifyRequest(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
) {
  const mode = getClassificationMode(request.query.mode as string);
  const schema =
    mode === ClassificationMode.EDIT
      ? classifyMultipartBodySchemaForEdit
      : classifyMultipartBodySchemaForTailor;

  try {
    if (!request.file && !request.body.resumeText) {
      response.status(HTTP_STATUS.BAD_REQUEST).json({
        error: ERROR_MESSAGES.VALIDATION_FAILED,
        details: [
          {
            path: FILE_FIELD_NAME,
            message: ERROR_MESSAGES.FILE_OR_RESUME_TEXT_REQUIRED,
          },
        ],
      });
      return;
    }

    schema.parse(request.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      response.status(HTTP_STATUS.BAD_REQUEST).json({
        error: ERROR_MESSAGES.VALIDATION_FAILED,
        details: error.issues.map((validationIssue) => ({
          path: validationIssue.path.join("."),
          message: validationIssue.message,
        })),
      });
      return;
    }
    next(error);
  }
}

classifyRouter.post(
  "/",
  verifyFirebaseToken,
  uploadMiddleware.single(FILE_FIELD_NAME),
  validateFile(),
  validateClassifyRequest,
  async (request: AuthenticatedRequest, response) => {
    try {
      const uploadedFile = request.file;
      const resumeTextFromRequest = request.body.resumeText;
      const jobTextFromRequest = request.body.jobText;
      const classificationMode = getClassificationMode(
        request.query.mode as string
      );

      let extractedResumeText: string;
      if (uploadedFile) {
        extractedResumeText = await extractTextFromPdfBuffer(
          uploadedFile.buffer
        );
      } else {
        extractedResumeText = resumeTextFromRequest!;
      }

      const jobDescriptionText = jobTextFromRequest || "";
      const classificationResult = await classifyContent(
        extractedResumeText,
        jobDescriptionText,
        classificationMode
      );

      const responseData = {
        ...classificationResult,
        extractedResumeText: uploadedFile ? extractedResumeText : undefined,
      };

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
