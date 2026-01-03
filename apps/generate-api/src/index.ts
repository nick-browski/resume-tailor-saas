import express from "express";
import cors from "cors";
import { generateRouter } from "./routes/generate.js";
import { classifyRouter } from "./routes/classify.js";
import { initializeFirebaseAdmin } from "./config/firebase-admin.js";
import {
  SUCCESS_MESSAGES,
  CORS_CONFIG,
  IS_CLOUD_RUN,
  SERVER_CONFIG,
  API_ROUTES,
} from "./config/constants.js";
import { verifyCloudTasksToken } from "./middleware/cloudTasksAuth.js";
import {
  processGeneration,
  processParseOriginal,
} from "./services/generateService.js";
import { createTaskHandler } from "./utils/taskHandler.js";
import {
  processGenerationTaskSchema,
  processParseOriginalTaskSchema,
} from "./schemas/taskSchemas.js";

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
app.use("/classify", classifyRouter);

// Generation processing handler (Cloud Tasks, requires OIDC auth)
app.post(
  API_ROUTES.TASKS_PROCESS_GENERATION,
  verifyCloudTasksToken,
  createTaskHandler(
    processGenerationTaskSchema,
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
    processParseOriginalTaskSchema,
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
