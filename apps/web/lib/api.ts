const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type RequestOptions = {
  method?: string;
  body?: Record<string, unknown>;
  token?: string | null;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const message =
      data.error || data.errors?.join(", ") || "Something went wrong";
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export type User = {
  id: number;
  email: string;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  has_password: boolean;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type MeResponse = {
  user: User;
};

export type CheckUsernameResponse = {
  available: boolean;
  error?: string;
};

export const authApi = {
  register(data: { email: string; username: string; password: string; name?: string }) {
    return apiFetch<AuthResponse>("/auth/register", { method: "POST", body: data });
  },

  login(data: { login: string; password: string }) {
    return apiFetch<AuthResponse>("/auth/login", { method: "POST", body: data });
  },

  me(token: string) {
    return apiFetch<MeResponse>("/auth/me", { token });
  },

  setUsername(token: string, username: string) {
    return apiFetch<{ user: User }>("/auth/set_username", {
      method: "POST",
      token,
      body: { username },
    });
  },

  checkUsername(username: string) {
    return apiFetch<CheckUsernameResponse>(
      `/auth/check_username?username=${encodeURIComponent(username)}`
    );
  },

  exchangeCode(code: string) {
    return apiFetch<AuthResponse>("/auth/exchange_code", {
      method: "POST",
      body: { code },
    });
  },

  googleAuthUrl() {
    return `${API_URL}/auth/google`;
  },
};
