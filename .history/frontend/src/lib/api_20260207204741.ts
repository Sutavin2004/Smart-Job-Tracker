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
    auth: boolean = true
  ): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

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

    return {
      ...headers,
      ...(extra as Record<string, string> | undefined),
    };
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
      throw new ApiError(res.status, res.statusText);
    }

    if (res.status === 204) {
      return {} as T;
    }

    return res.json();
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
}

export const apiClient = new ApiClient();
