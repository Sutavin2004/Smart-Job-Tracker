const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type RequestOptions = RequestInit & {
  auth?: boolean;
};

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  async request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (options.auth && this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include", // IMPORTANT for refresh token cookie
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    return res.json();
  }

  get<T>(path: string, auth = true) {
    return this.request<T>(path, { method: "GET", auth });
  }

  post<T>(path: string, body: any, auth = false) {
    return this.request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      auth,
    });
  }
}

export const apiClient = new ApiClient();
