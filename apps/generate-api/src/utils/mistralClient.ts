import {
  MISTRAL_CONFIG,
  ERROR_MESSAGES,
  REQUEST_HEADERS,
  HTTP_METHODS,
} from "../config/constants.js";

// Configuration
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY?.trim();
const MISTRAL_MODEL =
  process.env.MISTRAL_MODEL?.trim() || MISTRAL_CONFIG.DEFAULT_MODEL;
const MISTRAL_API_URL =
  process.env.MISTRAL_API_URL?.trim() || MISTRAL_CONFIG.API_URL;

// Types
export interface MistralMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface MistralRequest {
  model: string;
  messages: MistralMessage[];
  max_tokens?: number;
}

interface MistralChoice {
  message: {
    role: string;
    content: string;
  };
}

export interface MistralResponse {
  choices: MistralChoice[];
}

// Utilities
function delayExecution(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// API Client
async function makeMistralApiRequest(
  requestBody: MistralRequest,
  attemptNumber: number = 1
): Promise<Response> {
  if (!MISTRAL_API_KEY) {
    throw new Error(ERROR_MESSAGES.MISTRAL_API_KEY_NOT_CONFIGURED);
  }

  const authorizationHeader = `${REQUEST_HEADERS.AUTHORIZATION_PREFIX}${MISTRAL_API_KEY}`;

  const apiResponse = await fetch(MISTRAL_API_URL, {
    method: HTTP_METHODS.POST,
    headers: {
      Authorization: authorizationHeader,
      "Content-Type": REQUEST_HEADERS.CONTENT_TYPE_JSON,
    },
    body: JSON.stringify(requestBody),
  });

  if (apiResponse.ok) {
    return apiResponse;
  }

  // Format error message helper
  const formatErrorMessage = (status: number, errorText: string): string => {
    return ERROR_MESSAGES.MISTRAL_API_ERROR.replace(
      "{status}",
      status.toString()
    ).replace("{errorText}", errorText);
  };

  // Don't retry on 401 (unauthorized) - it's a configuration issue
  if (apiResponse.status === MISTRAL_CONFIG.UNAUTHORIZED_STATUS_CODE) {
    const errorResponseText = await apiResponse.text();
    throw new Error(formatErrorMessage(apiResponse.status, errorResponseText));
  }

  // Retry on transient errors
  const isRetriableError = (
    MISTRAL_CONFIG.RETRIABLE_STATUS_CODES as readonly number[]
  ).includes(apiResponse.status);
  const hasRetriesLeft = attemptNumber < MISTRAL_CONFIG.MAX_RETRIES;

  if (isRetriableError && hasRetriesLeft) {
    const retryDelayMilliseconds =
      MISTRAL_CONFIG.RETRY_DELAY_MS * attemptNumber;
    console.warn(
      `Mistral API error ${apiResponse.status}, retrying in ${retryDelayMilliseconds}ms (attempt ${attemptNumber}/${MISTRAL_CONFIG.MAX_RETRIES})`
    );
    await delayExecution(retryDelayMilliseconds);
    return makeMistralApiRequest(requestBody, attemptNumber + 1);
  }

  const errorResponseText = await apiResponse.text();
  throw new Error(formatErrorMessage(apiResponse.status, errorResponseText));
}

export async function callMistralAPI(
  messages: MistralMessage[],
  maxTokens: number = MISTRAL_CONFIG.MAX_TOKENS
): Promise<MistralResponse> {
  const requestBody: MistralRequest = {
    model: MISTRAL_MODEL,
    messages,
    max_tokens: maxTokens,
  };

  const apiResponse = await makeMistralApiRequest(requestBody);
  const mistralResponse = (await apiResponse.json()) as MistralResponse;

  if (!mistralResponse.choices?.[0]?.message?.content) {
    throw new Error(ERROR_MESSAGES.EMPTY_RESPONSE_FROM_MISTRAL);
  }

  return mistralResponse;
}
