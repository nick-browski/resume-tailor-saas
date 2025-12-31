import { auth } from "@/shared/config";
import type { ApiError } from "./types";

const CONTENT_TYPE_JSON = "application/json";
const AUTHORIZATION_HEADER = "Authorization";
const BEARER_PREFIX = "Bearer ";

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getFirebaseAuthToken(): Promise<string | null> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return null;
      }
      return await currentUser.getIdToken();
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const authToken = await this.getFirebaseAuthToken();
    const requestHeaders: Record<string, string> = {
      "Content-Type": CONTENT_TYPE_JSON,
      ...(options.headers as Record<string, string>),
    };

    if (authToken) {
      requestHeaders[AUTHORIZATION_HEADER] = `${BEARER_PREFIX}${authToken}`;
    }

    const requestUrl = `${this.baseURL}${endpoint}`;
    const httpResponse = await fetch(requestUrl, {
      ...options,
      headers: requestHeaders,
    });

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
    if (
      responseContentType &&
      responseContentType.includes(CONTENT_TYPE_JSON)
    ) {
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
    const authToken = await this.getFirebaseAuthToken();
    const requestHeaders: Record<string, string> = {};

    if (authToken) {
      requestHeaders[AUTHORIZATION_HEADER] = `${BEARER_PREFIX}${authToken}`;
    }

    const requestUrl = `${this.baseURL}${endpoint}`;
    const httpResponse = await fetch(requestUrl, {
      method: "POST",
      headers: requestHeaders,
      body: formData,
    });

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
    if (
      responseContentType &&
      responseContentType.includes(CONTENT_TYPE_JSON)
    ) {
      return await httpResponse.json();
    }

    return {} as T;
  }
}

export const createApiClient = (baseURL: string) => new ApiClient(baseURL);
