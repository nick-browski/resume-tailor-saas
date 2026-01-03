import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";
import { HTTP_STATUS } from "../config/constants.js";
import { VALIDATION_LIMITS, PDF_MIME_TYPE } from "../schemas/common.js";

export function validateRequest(schema: ZodSchema) {
  return (request: Request, response: Response, next: NextFunction) => {
    try {
      schema.parse(request.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        response.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "Validation failed",
          details: error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (request: Request, response: Response, next: NextFunction) => {
    try {
      schema.parse(request.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        response.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "Invalid parameters",
          details: error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

export function validateFile() {
  return (request: Request, response: Response, next: NextFunction) => {
    const file = request.file;

    if (!file) {
      next();
      return;
    }

    if (file.mimetype !== PDF_MIME_TYPE) {
      response.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "Validation failed",
        details: [
          {
            path: "file",
            message: "File must be a PDF",
          },
        ],
      });
      return;
    }

    if (file.size > VALIDATION_LIMITS.FILE_MAX_SIZE_BYTES) {
      response.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "Validation failed",
        details: [
          {
            path: "file",
            message: `File size must not exceed ${VALIDATION_LIMITS.FILE_MAX_SIZE_MB}MB`,
          },
        ],
      });
      return;
    }

    if (!file.originalname || file.originalname.trim().length === 0) {
      response.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "Validation failed",
        details: [
          {
            path: "file",
            message: "File name cannot be empty",
          },
        ],
      });
      return;
    }

    next();
  };
}

export function validateMultipartRequest(
  bodySchema: ZodSchema,
  requireFileOrText: boolean = false
) {
  return (request: Request, response: Response, next: NextFunction) => {
    try {
      if (requireFileOrText && !request.file && !request.body.resumeText) {
        response.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "Validation failed",
          details: [
            {
              path: "file",
              message: "Either file or resumeText is required",
            },
          ],
        });
        return;
      }

      bodySchema.parse(request.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        response.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "Validation failed",
          details: error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}
