import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch, ApiError } from "./api";

describe("ApiError", () => {
  it("sets name, message, status, and data", () => {
    const err = new ApiError("Bad request", 400, { code: "invalid" });
    expect(err.name).toBe("ApiError");
    expect(err.message).toBe("Bad request");
    expect(err.status).toBe(400);
    expect(err.data).toEqual({ code: "invalid" });
  });

  it("is an instance of Error", () => {
    const err = new ApiError("x", 500, null);
    expect(err).toBeInstanceOf(Error);
  });
});

describe("apiFetch", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.stubGlobal("fetch", originalFetch);
    vi.restoreAllMocks();
  });

  it("throws ApiError when response is not ok", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ errors: ["Title can't be blank"] }),
    });

    await expect(
      apiFetch("/ideas", { method: "POST", body: { title: "" }, token: "x" })
    ).rejects.toMatchObject({
      name: "ApiError",
      message: "Title can't be blank",
      status: 422,
    });
  });

  it("uses single error string when present", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    });

    await expect(apiFetch("/me", { token: "x" })).rejects.toMatchObject({
      message: "Unauthorized",
    });
  });

  it("returns parsed JSON on success", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ idea: { id: 1, title: "Test" } }),
    });

    const result = await apiFetch<{ idea: { id: number; title: string } }>("/ideas/1", {
      token: "x",
    });
    expect(result.idea.title).toBe("Test");
  });

  it("sends Authorization header when token provided", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await apiFetch("/me", { token: "secret-token" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer secret-token",
        }),
      })
    );
  });

  it("returns empty object for 204 No Content", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({}),
    });

    const result = await apiFetch("/delete");
    expect(result).toEqual({});
  });
});
