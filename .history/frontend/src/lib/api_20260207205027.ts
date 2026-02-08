const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/**
 * Standardized API error class so all callers can
 * reliably inspect status + message.
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

class ApiClient {
  private accessToken: string | null = null;

  /**
   * Set or clear the access token (called by AuthContext)
   */
  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  /**
   * Safely builds headers with full TypeScript correctness.
   * Handles all valid HeadersInit variants without `any`.
   */
  private buildHeaders(
    extra?: HeadersInit,
    auth: boolean = true
  ): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Normalize extra headers safely
    if (extra) {
      if (Array.isArray(extra)) {
        for (const [key, value] of extra) {
          headers[key] = value;
        }
      } else if (extra instanceof Headers) {
        extra.forEach((value, key) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, extra);
      }
    }

    if (auth && this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  /**
   * Core request method used by all HTTP verbs.
   * Fully typed response, no implicit anys.
   */
  private async request<TResponse>(
    path: string,
    options: RequestInit = {},
    auth: boolean = true
  ): Promise<TResponse> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: this.buildHeaders(options.headers, auth),
      credentials: "include",
    });

    if (!res.ok) {
      const message = await this.safeReadError(res);
      throw new ApiError(res.status, message);
    }

    // Some endpoints may return no content
    if (res.status === 204) {
      return {} as TResponse;
    }

    return res.json();
  }

  /**
   * Attempts to parse a backend error response safely.
   */
  private async safeReadError(res: Response): Promise<string> {
    try {
      const data: unknown = await res.json();

      if (
        typeof data === "object" &&
        data !== null &&
        "detail" in data &&
        typeof (data as { detail: unknown }).detail === "string"
      ) {
        return (data as { detail: string }).detail;
      }

      return JSON.stringify(data);
    } catch {
      return res.statusText || "Request failed";
    }
  }

  /* ======================
     HTTP Convenience APIs
     ====================== */

  get<TResponse>(path: string, auth = true): Promise<TResponse> {
    return this.request<TResponse>(path, { method: "GET" }, auth);
  }

  post<TResponse, TBody>(
    path: string,
    body: TBody,
    auth = false
  ): Promise<TResponse> {
    return this.request<TResponse>(
      path,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      auth
    );
  }

  put<TResponse, TBody>(
    path: string,
    body: TBody,
    auth = true
  ): Promise<TResponse> {
    return this.request<TResponse>(
      path,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
      auth
    );
  }

  delete<TResponse>(path: string, auth = true): Promise<TResponse> {
    return this.request<TResponse>(
      path,
      { method: "DELETE" },
      auth
    );
  }
}

/**
 * Single shared API client instance.
 * Imported everywhere — never re-created.
 */
export const apiClient = new ApiClient();
