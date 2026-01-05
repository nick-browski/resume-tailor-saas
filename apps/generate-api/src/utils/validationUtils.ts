import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import type { Response, NextFunction } from "express";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.js";

const FILE_FIELD_NAME = "file";

export function validateMultipartRequest(
  validationSchema: z.ZodSchema,
  requireFileOrText: boolean = false
) {
  return (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction
  ) => {
    try {
      if (requireFileOrText && !request.file && !request.body.resumeText) {
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

      validationSchema.parse(request.body);
      next();
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        response.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.VALIDATION_FAILED,
          details: validationError.issues.map((validationIssue) => ({
            path: validationIssue.path.join("."),
            message: validationIssue.message,
          })),
        });
        return;
      }
      next(validationError);
    }
  };
}
