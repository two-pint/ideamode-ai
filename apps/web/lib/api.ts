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

  if (res.status === 204) {
    return {} as T;
  }

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

export type IdeaStatus = "validating" | "validated" | "shelved";
export type IdeaVisibility = "private" | "shared";

export type Idea = {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  status: IdeaStatus;
  visibility: IdeaVisibility;
  brainstorm_id: number | null;
  brainstorm_slug?: string | null;
  brainstorm_title?: string | null;
  pinned_message_id?: string | null;
  pinned_message_content?: string | null;
  can_edit?: boolean;
  owner?: {
    id: number;
    username: string | null;
    name: string | null;
    avatar_url: string | null;
  };
  updated_at: string;
};

export type BrainstormStatus = "exploring" | "researching" | "ready" | "archived";
export type BrainstormVisibility = "private" | "shared";

export type Brainstorm = {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  status: BrainstormStatus;
  visibility: BrainstormVisibility;
  pinned_message_id?: string | null;
  pinned_message_content?: string | null;
  can_edit?: boolean;
  owner?: {
    id: number;
    username: string | null;
    name: string | null;
    avatar_url: string | null;
  };
  updated_at: string;
};

export type BrainstormResource = {
  id: number;
  url: string;
  title: string | null;
  resource_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  user_id: number | null;
  content: string;
};

export type ChatSessionResponse = {
  id: number;
  brainstorm_id: number;
  messages: ChatMessage[];
  pinned_message_id: string | null;
  pinned_message_content: string | null;
};

export type Member = {
  id: number;
  user_id: number;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
  role: "collaborator" | "viewer";
  accepted_at: string | null;
  created_at: string;
};

export type Invite = {
  id: number;
  email: string;
  role: "collaborator" | "viewer";
  expires_at: string;
  created_at: string;
  /** Present when listing/creating so inviter can build invite link. */
  token?: string;
};

export type MembersIndexResponse = {
  members: Member[];
  invites: Invite[];
};

export type MemberCreateResponse = { member: Member };
export type InviteCreateResponse = { invite: Invite };
export type MemberUpdateResponse = { member: Member };

export type InviteShowResponse = {
  type: "brainstorm" | "idea";
  email: string;
  role: string;
  expires_at: string;
  resource: { id: number; title: string; slug: string; owner_username: string };
  invited_by: { id: number; username: string | null; name: string | null; avatar_url: string | null };
};

export type InviteAcceptResponse = {
  resource_type: "brainstorm" | "idea";
  resource: { id: number; title: string; slug: string; owner_username: string };
};

export type ResourceType = "brainstorm" | "idea";

function membersPath(username: string, slug: string, resourceType: ResourceType): string {
  const segment = resourceType === "brainstorm" ? "brainstorms" : "ideas";
  return `/${encodeURIComponent(username)}/${segment}/${encodeURIComponent(slug)}/members`;
}

export const membersApi = {
  list(token: string, username: string, slug: string, resourceType: ResourceType) {
    return apiFetch<MembersIndexResponse>(membersPath(username, slug, resourceType), {
      token,
    });
  },

  create(
    token: string,
    username: string,
    slug: string,
    resourceType: ResourceType,
    data: {
      email?: string;
      /** Use invitee_username so it doesn't overwrite route :username (owner). */
      invitee_username?: string;
      role?: "collaborator" | "viewer";
    }
  ) {
    const body: Record<string, unknown> = {};
    if (data.email != null && data.email.trim() !== "") {
      body.email = data.email.trim().toLowerCase();
    } else if (data.invitee_username != null && data.invitee_username.trim() !== "") {
      body.invitee_username = data.invitee_username.trim();
    }
    if (data.role != null) body.role = data.role;
    return apiFetch<MemberCreateResponse | InviteCreateResponse>(
      membersPath(username, slug, resourceType),
      {
        method: "POST",
        token,
        body,
      }
    );
  },

  updateRole(
    token: string,
    username: string,
    slug: string,
    resourceType: ResourceType,
    memberId: number,
    role: "collaborator" | "viewer"
  ) {
    return apiFetch<MemberUpdateResponse>(
      `${membersPath(username, slug, resourceType)}/${memberId}`,
      {
        method: "PATCH",
        token,
        body: { role },
      }
    );
  },

  remove(
    token: string,
    username: string,
    slug: string,
    resourceType: ResourceType,
    id: number
  ) {
    return apiFetch<Record<string, never>>(
      `${membersPath(username, slug, resourceType)}/${id}`,
      { method: "DELETE", token }
    );
  },
};

export type PendingInviteItem = {
  token: string;
  type: "brainstorm" | "idea";
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
  resource: { id: number; title: string; slug: string; owner_username: string };
  invited_by: { id: number; username: string | null; name: string | null; avatar_url: string | null };
};

export type PendingInvitesResponse = { invites: PendingInviteItem[] };

export const invitesApi = {
  listMine(token: string) {
    return apiFetch<PendingInvitesResponse>("/me/invites", { token });
  },

  getByToken(token: string, inviteToken: string) {
    return apiFetch<InviteShowResponse>(`/invites/${encodeURIComponent(inviteToken)}`, {
      token,
    });
  },

  accept(token: string, inviteToken: string) {
    return apiFetch<InviteAcceptResponse>(
      `/invites/${encodeURIComponent(inviteToken)}/accept`,
      { method: "POST", token }
    );
  },
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
    data: { title: string; description?: string; slug?: string; brainstorm_id?: number | null }
  ) {
    return apiFetch<IdeaResponse>("/ideas", {
      method: "POST",
      token,
      body: data,
    });
  },

  getByOwnerAndSlug(token: string, username: string, slug: string) {
    return apiFetch<IdeaResponse>(
      `/${encodeURIComponent(username)}/ideas/${encodeURIComponent(slug)}`,
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
      `/${encodeURIComponent(username)}/ideas/${encodeURIComponent(slug)}`,
      {
        method: "PATCH",
        token,
        body: data as Record<string, unknown>,
      }
    );
  },

  deleteByOwnerAndSlug(token: string, username: string, slug: string) {
    return apiFetch<Record<string, never>>(
      `/${encodeURIComponent(username)}/ideas/${encodeURIComponent(slug)}`,
      { method: "DELETE", token }
    );
  },
};

export type BrainstormsResponse = {
  brainstorms: Brainstorm[];
};

export type BrainstormResponse = {
  brainstorm: Brainstorm;
};

export const brainstormsApi = {
  listMine(token: string) {
    return apiFetch<BrainstormsResponse>("/brainstorms", { token });
  },

  listShared(token: string) {
    return apiFetch<BrainstormsResponse>("/brainstorms/shared", { token });
  },

  create(
    token: string,
    data: { title: string; description?: string; slug?: string }
  ) {
    return apiFetch<BrainstormResponse>("/brainstorms", {
      method: "POST",
      token,
      body: data,
    });
  },

  getByOwnerAndSlug(token: string, username: string, slug: string) {
    return apiFetch<BrainstormResponse>(
      `/${encodeURIComponent(username)}/brainstorms/${encodeURIComponent(slug)}`,
      { token }
    );
  },

  updateByOwnerAndSlug(
    token: string,
    username: string,
    slug: string,
    data: Partial<Pick<Brainstorm, "title" | "description" | "status" | "visibility" | "slug">>
  ) {
    return apiFetch<BrainstormResponse>(
      `/${encodeURIComponent(username)}/brainstorms/${encodeURIComponent(slug)}`,
      {
        method: "PATCH",
        token,
        body: data as Record<string, unknown>,
      }
    );
  },

  deleteByOwnerAndSlug(token: string, username: string, slug: string) {
    return apiFetch<Record<string, never>>(
      `/${encodeURIComponent(username)}/brainstorms/${encodeURIComponent(slug)}`,
      { method: "DELETE", token }
    );
  },

  createIdeaFromBrainstorm(
    token: string,
    username: string,
    slug: string,
    data: { title: string; description?: string; slug?: string; member_ids?: number[] }
  ) {
    return apiFetch<IdeaResponse>(
      `/${encodeURIComponent(username)}/brainstorms/${encodeURIComponent(slug)}/create-idea`,
      { method: "POST", token, body: data as Record<string, unknown> }
    );
  },
};

export type BrainstormResourcesResponse = { resources: BrainstormResource[] };
export type BrainstormResourceResponse = { resource: BrainstormResource };

export const brainstormResourcesApi = {
  list(token: string, username: string, slug: string) {
    return apiFetch<BrainstormResourcesResponse>(
      `/${encodeURIComponent(username)}/brainstorms/${encodeURIComponent(slug)}/resources`,
      { token }
    );
  },

  create(
    token: string,
    username: string,
    slug: string,
    data: { url: string; title?: string; notes?: string }
  ) {
    return apiFetch<BrainstormResourceResponse>(
      `/${encodeURIComponent(username)}/brainstorms/${encodeURIComponent(slug)}/resources`,
      { method: "POST", token, body: data as Record<string, unknown> }
    );
  },

  update(
    token: string,
    username: string,
    slug: string,
    id: number,
    data: { url?: string; title?: string; notes?: string }
  ) {
    return apiFetch<BrainstormResourceResponse>(
      `/${encodeURIComponent(username)}/brainstorms/${encodeURIComponent(slug)}/resources/${id}`,
      { method: "PATCH", token, body: data as Record<string, unknown> }
    );
  },

  delete(token: string, username: string, slug: string, id: number) {
    return apiFetch<Record<string, never>>(
      `/${encodeURIComponent(username)}/brainstorms/${encodeURIComponent(slug)}/resources/${id}`,
      { method: "DELETE", token }
    );
  },
};

export type BrainstormNoteResponse = {
  note: {
    id?: number;
    brainstorm_id?: number;
    content: Record<string, unknown>;
    updated_at: string | null;
  };
};

export type BrainstormResearchItem = {
  id: number;
  brainstorm_id: number;
  research_type: string;
  query: string;
  result: {
    summary?: string;
    links?: Array<{ url: string; title?: string }>;
    competitors?: Array<{ name: string; url?: string; one_liner?: string }>;
    key_takeaways?: string[];
    error?: string;
  };
  created_at: string;
};

export type BrainstormResearchListResponse = { research: BrainstormResearchItem[] };
export type BrainstormResearchItemResponse = { research: BrainstormResearchItem };

export const brainstormResearchApi = {
  list(token: string, username: string, slug: string) {
    return apiFetch<BrainstormResearchListResponse>(
      `/${encodeURIComponent(username)}/brainstorms/${encodeURIComponent(slug)}/research`,
      { token }
    );
  },

  create(
    token: string,
    username: string,
    slug: string,
    data: { research_type: string; query: string }
  ) {
    return apiFetch<BrainstormResearchItemResponse>(
      `/${encodeURIComponent(username)}/brainstorms/${encodeURIComponent(slug)}/research`,
      { method: "POST", token, body: data }
    );
  },

  get(token: string, username: string, slug: string, id: number) {
    return apiFetch<BrainstormResearchItemResponse>(
      `/${encodeURIComponent(username)}/brainstorms/${encodeURIComponent(slug)}/research/${id}`,
      { token }
    );
  },
};

export const brainstormNotesApi = {
  get(token: string, username: string, slug: string) {
    return apiFetch<BrainstormNoteResponse>(
      `/${encodeURIComponent(username)}/brainstorms/${encodeURIComponent(slug)}/note`,
      { token }
    );
  },

  update(
    token: string,
    username: string,
    slug: string,
    content: Record<string, unknown>
  ) {
    return apiFetch<BrainstormNoteResponse>(
      `/${encodeURIComponent(username)}/brainstorms/${encodeURIComponent(slug)}/note`,
      { method: "PUT", token, body: { content } }
    );
  },
};

export const chatSessionsApi = {
  getSession(token: string, username: string, slug: string) {
    return apiFetch<ChatSessionResponse>(
      `/${encodeURIComponent(username)}/brainstorms/${encodeURIComponent(slug)}/chat/session`,
      { token }
    );
  },

  async postMessage(
    token: string,
    username: string,
    slug: string,
    content: string,
    onStreamChunk?: (chunk: string) => void
  ): Promise<{ message?: ChatMessage; session?: ChatSessionResponse }> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const url = `${API_URL}/${encodeURIComponent(username)}/brainstorms/${encodeURIComponent(slug)}/chat/session/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      let errData: Record<string, unknown> = {};
      try { errData = await res.json(); } catch { /* ignore */ }
      throw new ApiError(
        typeof errData.error === "string" ? errData.error : Array.isArray(errData.errors) ? errData.errors.join(", ") : "Request failed",
        res.status,
        errData
      );
    }
    const contentType = res.headers.get("Content-Type") || "";
    if (contentType.includes("text/event-stream") && onStreamChunk) {
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new ApiError("No body", res.status, null);
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              onStreamChunk(typeof data === "string" ? data : String(data));
            } catch {
              // ignore parse errors
            }
          }
        }
      }
      return {};
    }
    const data = await res.json();
    return { message: data.message, session: data.session };
  },

  pinMessage(token: string, username: string, slug: string, messageId: string) {
    return apiFetch<{ pinned_message_id: string; pinned_message_content: string | null }>(
      `/${encodeURIComponent(username)}/brainstorms/${encodeURIComponent(slug)}/chat/session/pin`,
      { method: "POST", token, body: { message_id: messageId } }
    );
  },
};

export type DiscussionSessionResponse = {
  id: number;
  idea_id: number;
  messages: ChatMessage[];
  archived_at: string | null;
  created_at: string;
  pinned_message_id: string | null;
  pinned_message_content: string | null;
};

export type DiscussionSessionsListResponse = { sessions: DiscussionSessionResponse[] };

export const discussionSessionsApi = {
  list(token: string, username: string, slug: string) {
    return apiFetch<DiscussionSessionsListResponse>(
      `/${encodeURIComponent(username)}/ideas/${encodeURIComponent(slug)}/discussion/sessions`,
      { token }
    );
  },

  create(token: string, username: string, slug: string) {
    return apiFetch<DiscussionSessionResponse>(
      `/${encodeURIComponent(username)}/ideas/${encodeURIComponent(slug)}/discussion/sessions`,
      { method: "POST", token }
    );
  },

  getCurrent(token: string, username: string, slug: string) {
    return apiFetch<DiscussionSessionResponse>(
      `/${encodeURIComponent(username)}/ideas/${encodeURIComponent(slug)}/discussion/sessions/current`,
      { token }
    );
  },

  get(token: string, username: string, slug: string, sessionId: number) {
    return apiFetch<DiscussionSessionResponse>(
      `/${encodeURIComponent(username)}/ideas/${encodeURIComponent(slug)}/discussion/sessions/${sessionId}`,
      { token }
    );
  },

  async postMessage(
    token: string,
    username: string,
    slug: string,
    sessionId: number,
    content: string,
    onStreamChunk?: (chunk: string) => void
  ): Promise<{ session?: DiscussionSessionResponse }> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const url = `${API_URL}/${encodeURIComponent(username)}/ideas/${encodeURIComponent(slug)}/discussion/sessions/${sessionId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      let errData: Record<string, unknown> = {};
      try { errData = await res.json(); } catch { /* ignore */ }
      throw new ApiError(
        typeof errData.error === "string" ? errData.error : Array.isArray(errData.errors) ? errData.errors.join(", ") : "Request failed",
        res.status,
        errData
      );
    }
    const contentType = res.headers.get("Content-Type") || "";
    if (contentType.includes("text/event-stream") && onStreamChunk) {
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new ApiError("No body", res.status, null);
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              onStreamChunk(typeof data === "string" ? data : String(data));
            } catch {
              // ignore parse errors
            }
          }
        }
      }
      return {};
    }
    const data = await res.json();
    return { session: data.session };
  },

  pinMessage(
    token: string,
    username: string,
    slug: string,
    sessionId: number,
    messageId: string
  ) {
    return apiFetch<{ pinned_message_id: string; pinned_message_content: string | null }>(
      `/${encodeURIComponent(username)}/ideas/${encodeURIComponent(slug)}/discussion/sessions/${sessionId}/pin`,
      { method: "POST", token, body: { message_id: messageId } }
    );
  },
};

export type IdeaAnalysisType = "competitor" | "tam" | "pmf" | "full";
export type IdeaAnalysisStatus = "pending" | "running" | "completed" | "failed";

export type CompetitorItem = {
  name: string;
  strengths?: string[];
  weaknesses?: string[];
  pricing?: string;
};

export type IdeaAnalysisResult = {
  competitor_analysis?: {
    summary?: string;
    competitors?: CompetitorItem[];
    saturation_score?: number;
    whitespace?: string;
  };
  market_size?: {
    tam_estimate?: string;
    sam_estimate?: string;
    confidence?: string;
    proxies_used?: string[];
  };
  pmf_signals?: {
    demand_evidence?: string;
    pain_point_strength?: string;
    willingness_to_pay_signals?: string;
  };
  verdict?: {
    score?: number;
    recommendation?: string;
    key_risks?: string[];
    next_steps?: string[];
  };
  error?: string;
};

export type IdeaAnalysisItem = {
  id: number;
  idea_id: number;
  analysis_type: string;
  status: IdeaAnalysisStatus;
  result: IdeaAnalysisResult;
  annotations: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type IdeaAnalysesListResponse = { analyses: IdeaAnalysisItem[] };
export type IdeaAnalysisItemResponse = { analysis?: IdeaAnalysisItem };

export const ideaAnalysesApi = {
  list(token: string, username: string, slug: string) {
    return apiFetch<IdeaAnalysesListResponse>(
      `/${encodeURIComponent(username)}/ideas/${encodeURIComponent(slug)}/analyses`,
      { token }
    );
  },

  create(token: string, username: string, slug: string, analysis_type: IdeaAnalysisType) {
    return apiFetch<IdeaAnalysisItem>(
      `/${encodeURIComponent(username)}/ideas/${encodeURIComponent(slug)}/analyses`,
      { method: "POST", token, body: { analysis_type } }
    );
  },

  get(token: string, username: string, slug: string, id: number) {
    return apiFetch<IdeaAnalysisItem>(
      `/${encodeURIComponent(username)}/ideas/${encodeURIComponent(slug)}/analyses/${id}`,
      { token }
    );
  },

  updateAnnotations(
    token: string,
    username: string,
    slug: string,
    id: number,
    annotations: Record<string, unknown>
  ) {
    return apiFetch<IdeaAnalysisItem>(
      `/${encodeURIComponent(username)}/ideas/${encodeURIComponent(slug)}/analyses/${id}`,
      { method: "PATCH", token, body: { annotations } }
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

  getBrainstorms(token: string, username: string) {
    return apiFetch<BrainstormsResponse>(
      `/users/${encodeURIComponent(username)}/brainstorms`,
      { token }
    );
  },
};
