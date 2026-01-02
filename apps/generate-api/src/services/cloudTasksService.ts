import { CloudTasksClient } from "@google-cloud/tasks";
import {
  IS_DEV,
  ERROR_MESSAGES,
  API_ROUTES,
  IS_CLOUD_RUN,
} from "../config/constants.js";
import {
  SERVICE_URL,
  CLOUD_TASKS_SERVICE_ACCOUNT,
  CLOUD_TASKS_CONFIG,
} from "../config/serviceConfig.js";

const cloudTasksClient = new CloudTasksClient();

// Log Cloud Tasks configuration once at startup (prod only)
if (IS_CLOUD_RUN && !IS_DEV) {
  const queuePath = cloudTasksClient.queuePath(
    CLOUD_TASKS_CONFIG.PROJECT_ID,
    CLOUD_TASKS_CONFIG.LOCATION,
    CLOUD_TASKS_CONFIG.QUEUE_NAME
  );
  console.log("[CLOUD_TASKS_CONFIG]", {
    PROJECT_ID: CLOUD_TASKS_CONFIG.PROJECT_ID,
    LOCATION: CLOUD_TASKS_CONFIG.LOCATION,
    QUEUE_NAME: CLOUD_TASKS_CONFIG.QUEUE_NAME,
    queuePath,
    SERVICE_URL,
    CLOUD_TASKS_SERVICE_ACCOUNT,
  });
}

function validateServiceUrl(): void {
  if (!SERVICE_URL) {
    throw new Error(ERROR_MESSAGES.SERVICE_URL_NOT_CONFIGURED);
  }
}

async function createCloudTaskWithOidcAuth(
  taskEndpointPath: string,
  taskPayload: Record<string, unknown>
): Promise<void> {
  validateServiceUrl();

  const taskUrl = `${SERVICE_URL}${taskEndpointPath}`;

  if (IS_DEV) {
    // Dev: direct HTTP POST (localhost, no auth)
    const httpResponse = await fetch(taskUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskPayload),
    });

    if (!httpResponse.ok) {
      const errorResponseText = await httpResponse.text();
      throw new Error(
        `Task execution failed: ${httpResponse.status} ${errorResponseText}`
      );
    }
    return;
  }

  // Prod: Cloud Tasks with OIDC auth
  const queuePath = cloudTasksClient.queuePath(
    CLOUD_TASKS_CONFIG.PROJECT_ID,
    CLOUD_TASKS_CONFIG.LOCATION,
    CLOUD_TASKS_CONFIG.QUEUE_NAME
  );

  const cloudTask = {
    httpRequest: {
      httpMethod: "POST" as const,
      url: taskUrl,
      headers: {
        "Content-Type": "application/json",
      },
      body: Buffer.from(JSON.stringify(taskPayload)).toString("base64"),
      oidcToken: {
        serviceAccountEmail: CLOUD_TASKS_SERVICE_ACCOUNT,
        audience: SERVICE_URL,
      },
    },
  };

  try {
    await cloudTasksClient.createTask({
      parent: queuePath,
      task: cloudTask,
    });
  } catch (createTaskError) {
    const errorMessage =
      createTaskError instanceof Error
        ? createTaskError.message
        : String(createTaskError);
    console.error("[CLOUD_TASKS_CREATE_ERROR]", {
      error: errorMessage,
      queuePath,
      serviceAccountEmail: CLOUD_TASKS_SERVICE_ACCOUNT,
      taskUrl,
      projectId: CLOUD_TASKS_CONFIG.PROJECT_ID,
      location: CLOUD_TASKS_CONFIG.LOCATION,
      queueName: CLOUD_TASKS_CONFIG.QUEUE_NAME,
    });
    throw createTaskError;
  }
}

export async function createGenerationTask(
  documentId: string,
  resumeText: string,
  jobText: string,
  ownerId: string
): Promise<void> {
  await createCloudTaskWithOidcAuth(API_ROUTES.TASKS_PROCESS_GENERATION, {
    documentId,
    resumeText,
    jobText,
    ownerId,
  });
}

export async function createParseOriginalTask(
  documentId: string,
  resumeText: string,
  ownerId: string
): Promise<void> {
  await createCloudTaskWithOidcAuth(API_ROUTES.TASKS_PROCESS_PARSE_ORIGINAL, {
    documentId,
    resumeText,
    ownerId,
  });
}
