const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private buildHeaders(
    extra?: HeadersInit,
    auth?: boolean
  ): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(extra || {}),
    };

    if (auth && this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  async request<T>(
    path: string,
    options: RequestInit = {},
    auth: boolean = true
  ): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: this.buildHeaders(options.headers, auth),
      credentials: "include",
    });

    if (!res.ok) {
      const message = await this.safeReadError(res);
      throw new ApiError(res.status, message);
    }

    // Some endpoints might return no content
    if (res.status === 204) {
      return {} as T;
    }

    return res.json();
  }

  private async safeReadError(res: Response): Promise<string> {
    try {
      const data = await res.json();
      if (typeof data.detail === "string") return data.detail;
      return JSON.stringify(data);
    } catch {
      return res.statusText || "Request failed";
    }
  }

  get<T>(path: string, auth = true) {
    return this.request<T>(path, { method: "GET" }, auth);
  }

  post<T>(path: string, body: any, auth = false) {
    return this.request<T>(
      path,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      auth
    );
  }

  put<T>(path: string, body: any, auth = true) {
    return this.request<T>(
      path,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
      auth
    );
  }

  delete<T>(path: string, auth = true) {
    return this.request<T>(path, { method: "DELETE" }, auth);
  }
}

export const apiClient = new ApiClient();
