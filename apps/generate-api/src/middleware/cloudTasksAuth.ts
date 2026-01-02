import { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  REQUEST_HEADERS,
} from "../config/constants.js";
import {
  SERVICE_URL,
  CLOUD_TASKS_SERVICE_ACCOUNT,
} from "../config/serviceConfig.js";

const oauth2Client = new OAuth2Client();

// Verifies Cloud Tasks OIDC token (audience must be base service URL without path)
export async function verifyCloudTasksToken(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
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

  const bearerToken = authorizationHeader.substring(
    REQUEST_HEADERS.AUTHORIZATION_PREFIX.length
  );

  if (!SERVICE_URL) {
    console.error(ERROR_MESSAGES.SERVICE_URL_NOT_CONFIGURED);
    response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: "Service configuration error",
    });
    return;
  }

  try {
    const idTokenTicket = await oauth2Client.verifyIdToken({
      idToken: bearerToken,
      audience: SERVICE_URL,
    });

    const tokenPayload = idTokenTicket.getPayload();
    if (!tokenPayload) {
      response.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.INVALID_TOKEN,
      });
      return;
    }

    // Verify audience matches (SERVICE_URL already normalized)
    const tokenAudience = tokenPayload.aud;
    const normalizedTokenAudience =
      typeof tokenAudience === "string"
        ? tokenAudience.replace(/\/+$/, "")
        : tokenAudience;

    if (normalizedTokenAudience !== SERVICE_URL) {
      console.warn(
        `Audience mismatch: token audience=${normalizedTokenAudience}, expected=${SERVICE_URL}`
      );
      response.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: "Token audience mismatch",
      });
      return;
    }

    if (tokenPayload.email !== CLOUD_TASKS_SERVICE_ACCOUNT) {
      console.warn(
        `Token email ${tokenPayload.email} does not match expected ${CLOUD_TASKS_SERVICE_ACCOUNT}`
      );
      response.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: "Token not from Cloud Tasks service account",
      });
      return;
    }

    next();
  } catch (verificationError) {
    console.error("Cloud Tasks token verification error:", verificationError);
    response.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: ERROR_MESSAGES.INVALID_TOKEN,
    });
  }
}
