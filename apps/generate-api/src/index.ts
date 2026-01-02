import express from "express";
import cors from "cors";
import { generateRouter } from "./routes/generate.js";
import { initializeFirebaseAdmin } from "./config/firebase-admin.js";
import {
  SUCCESS_MESSAGES,
  CORS_CONFIG,
  HTTP_STATUS,
  IS_CLOUD_RUN,
  SERVER_CONFIG,
  API_ROUTES,
  ERROR_MESSAGES,
} from "./config/constants.js";
import { verifyCloudTasksToken } from "./middleware/cloudTasksAuth.js";
import {
  processGeneration,
  processParseOriginal,
} from "./services/generateService.js";

const serverPort = Number(process.env.PORT) || SERVER_CONFIG.DEFAULT_PORT;

initializeFirebaseAdmin();

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || CORS_CONFIG.DEFAULT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(API_ROUTES.DOCUMENTS, generateRouter);

// Common task handler factory
const createTaskHandler = (
  validateFields: (body: any) => string | null,
  processTask: (body: any) => Promise<void>,
  errorContext: string
) => {
  return async (request: express.Request, response: express.Response) => {
    try {
      const validationError = validateFields(request.body);
      if (validationError) {
        response.status(HTTP_STATUS.BAD_REQUEST).json({
          error: validationError,
        });
        return;
      }

      await processTask(request.body);
      response.status(HTTP_STATUS.OK).json({ success: true });
    } catch (taskError) {
      console.error(`Error processing ${errorContext}:`, taskError);
      const errorMessage =
        taskError instanceof Error
          ? taskError.message
          : ERROR_MESSAGES.UNKNOWN_ERROR;
      response.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: errorMessage,
      });
    }
  };
};

// Generation processing handler (Cloud Tasks, requires OIDC auth)
app.post(
  API_ROUTES.TASKS_PROCESS_GENERATION,
  verifyCloudTasksToken,
  createTaskHandler(
    (body) => {
      if (
        !body.documentId ||
        !body.resumeText ||
        !body.jobText ||
        !body.ownerId
      ) {
        return ERROR_MESSAGES.MISSING_REQUIRED_FIELDS_GENERATION;
      }
      return null;
    },
    (body) =>
      processGeneration(
        body.documentId,
        body.resumeText,
        body.jobText,
        body.ownerId
      ),
    "generation task"
  )
);

// Parse original processing handler (Cloud Tasks, requires OIDC auth)
app.post(
  API_ROUTES.TASKS_PROCESS_PARSE_ORIGINAL,
  verifyCloudTasksToken,
  createTaskHandler(
    (body) => {
      if (!body.documentId || !body.resumeText || !body.ownerId) {
        return ERROR_MESSAGES.MISSING_REQUIRED_FIELDS_PARSE;
      }
      return null;
    },
    (body) =>
      processParseOriginal(body.documentId, body.resumeText, body.ownerId),
    "parse-original task"
  )
);

app.get(API_ROUTES.HEALTH, (request, response) => {
  response.json({ status: SUCCESS_MESSAGES.HEALTH_CHECK });
});

const serverHost = IS_CLOUD_RUN ? undefined : SERVER_CONFIG.LOCALHOST_IP;
if (serverHost) {
  app.listen(serverPort, serverHost, () => {
    console.log(`Generate API listening on ${serverHost}:${serverPort}`);
  });
} else {
  app.listen(serverPort, () => {
    console.log(
      `Generate API listening on ${SERVER_CONFIG.ALL_INTERFACES_IP}:${serverPort}`
    );
  });
}
