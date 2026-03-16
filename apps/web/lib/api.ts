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

  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }

  if (!res.ok) {
    const errorMessage =
      typeof data.error === "string"
        ? data.error
        : Array.isArray(data.errors)
          ? data.errors.join(", ")
          : "Something went wrong";
    throw new ApiError(errorMessage, res.status, data);
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

export type IdeaStatus = "brainstorm" | "validating" | "validated" | "shelved";
export type IdeaVisibility = "private" | "shared";

export type Idea = {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  status: IdeaStatus;
  visibility: IdeaVisibility;
  owner?: {
    id: number;
    username: string | null;
    name: string | null;
    avatar_url: string | null;
  };
  updated_at: string;
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

export type IdeasResponse = {
  ideas: Idea[];
};

export type IdeaResponse = {
  idea: Idea;
};

export type ProfileResponse = {
  user: Pick<User, "id" | "username" | "name" | "avatar_url" | "bio">;
};

export const ideasApi = {
  listMine(token: string) {
    return apiFetch<IdeasResponse>("/ideas", { token });
  },

  listShared(token: string) {
    return apiFetch<IdeasResponse>("/ideas/shared", { token });
  },

  create(
    token: string,
    data: { title: string; description?: string; slug?: string }
  ) {
    return apiFetch<IdeaResponse>("/ideas", {
      method: "POST",
      token,
      body: data,
    });
  },

  getByOwnerAndSlug(token: string, username: string, slug: string) {
    return apiFetch<IdeaResponse>(
      `/ideas/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`,
      { token }
    );
  },

  updateByOwnerAndSlug(
    token: string,
    username: string,
    slug: string,
    data: Partial<Pick<Idea, "title" | "description" | "status" | "visibility" | "slug">>
  ) {
    return apiFetch<IdeaResponse>(
      `/ideas/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`,
      {
        method: "PATCH",
        token,
        body: data as Record<string, unknown>,
      }
    );
  },
};

export const usersApi = {
  getProfile(token: string, username: string) {
    return apiFetch<ProfileResponse>(`/users/${encodeURIComponent(username)}`, {
      token,
    });
  },

  getIdeas(token: string, username: string) {
    return apiFetch<IdeasResponse>(
      `/users/${encodeURIComponent(username)}/ideas`,
      { token }
    );
  },
};
