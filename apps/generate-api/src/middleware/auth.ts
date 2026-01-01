import { Request, Response, NextFunction } from "express";
import { getAuth } from "../config/firebase-admin.js";
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  REQUEST_HEADERS,
} from "../config/constants.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Verifies Firebase ID token from Authorization header and sets userId
export async function verifyFirebaseToken(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const authorizationHeader = request.headers.authorization;

    if (
      !authorizationHeader ||
      !authorizationHeader.startsWith(REQUEST_HEADERS.AUTHORIZATION_PREFIX)
    ) {
      response.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.MISSING_AUTHORIZATION_HEADER,
      });
      return;
    }

    const idToken = authorizationHeader.split(
      REQUEST_HEADERS.AUTHORIZATION_PREFIX
    )[1];
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    request.userId = decodedToken.uid;

    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    response.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: ERROR_MESSAGES.INVALID_TOKEN,
    });
  }
}
