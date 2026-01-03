import { auth } from "@/shared/config";
import type { ApiError } from "./types";

const CONTENT_TYPE_JSON = "application/json";
const BEARER_PREFIX = "Bearer ";

// Safe diagnostics flag (only in development)
const ENABLE_AUTH_LOGS = import.meta.env.DEV;

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Gets Firebase ID token with force refresh and returns auth header
  private async getFirebaseAuthHeader(): Promise<{ Authorization: string }> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("AUTH_REQUIRED");
    }

    try {
      // Force refresh to ensure fresh token
      const token = await currentUser.getIdToken(true);

      return { Authorization: `${BEARER_PREFIX}${token}` };
    } catch (error) {
      console.error("Failed to get auth token:", error);
      throw new Error("AUTH_TOKEN_FETCH_FAILED");
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOn401 = true
  ): Promise<T> {
    // Get auth header (throws if user not authenticated)
    let authHeader: { Authorization: string };
    try {
      authHeader = await this.getFirebaseAuthHeader();
    } catch (error) {
      if (ENABLE_AUTH_LOGS) {
        console.warn("[API_AUTH_MISSING_USER]", { endpoint });
      }
      throw error;
    }

    const requestHeaders: Record<string, string> = {
      ...authHeader,
      ...(options.headers as Record<string, string>),
    };

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      requestHeaders["Content-Type"] = CONTENT_TYPE_JSON;
    }

    const requestUrl = `${this.baseURL}${endpoint}`;

    let httpResponse = await fetch(requestUrl, {
      ...options,
      headers: requestHeaders,
    });

    // Retry once on 401 with fresh token
    if (httpResponse.status === 401 && retryOn401) {
      const currentUser = auth.currentUser;
      if (currentUser) {
        if (ENABLE_AUTH_LOGS) {
          console.info("[API_AUTH_RETRY]", { endpoint, reason: "401" });
        }

        try {
          // Force refresh token and retry once
          const freshToken = await currentUser.getIdToken(true);
          const retryHeaders: Record<string, string> = {
            ...requestHeaders,
            Authorization: `${BEARER_PREFIX}${freshToken}`,
          };

          httpResponse = await fetch(requestUrl, {
            ...options,
            headers: retryHeaders,
          });
        } catch (retryError) {
          // If retry token fetch fails, continue with original 401 response
          if (ENABLE_AUTH_LOGS) {
            console.warn("[API_AUTH_RETRY_FAILED]", { endpoint });
          }
        }
      }
    }

    if (!httpResponse.ok) {
      const apiError: ApiError = {
        message: `HTTP error! status: ${httpResponse.status}`,
        status: httpResponse.status,
      };

      try {
        const errorResponseData = await httpResponse.json();
        apiError.message = errorResponseData.message || apiError.message;
        apiError.code = errorResponseData.code;
      } catch {
        // Non-JSON error response
      }

      throw apiError;
    }

    const responseContentType = httpResponse.headers.get("content-type");

    // Handle blob responses (e.g., PDF)
    if (
      responseContentType?.includes("application/pdf") ||
      responseContentType?.includes("application/octet-stream")
    ) {
      return (await httpResponse.blob()) as T;
    }

    // Handle JSON responses
    if (responseContentType?.includes(CONTENT_TYPE_JSON)) {
      return await httpResponse.json();
    }

    return {} as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "POST",
      body: formData,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const createApiClient = (baseURL: string) => new ApiClient(baseURL);
