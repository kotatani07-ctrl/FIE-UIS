import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  it("uses the same-origin API without cookies or cross-origin redirects", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest<{ status: string }>("health/")).resolves.toEqual({
      status: "ok",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("/api/v1/health/", window.location.origin),
      expect.objectContaining({
        credentials: "omit",
        mode: "same-origin",
        redirect: "error",
      }),
    );
  });

  it("rejects path traversal and non-contact POST requests", async () => {
    await expect(apiRequest("../admin/")).rejects.toThrow(
      "Path API tidak valid",
    );
    await expect(
      apiRequest("news/", { method: "POST", body: {} }),
    ).rejects.toThrow("POST hanya diizinkan");
  });

  it("preserves the API error contract for failed requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: "Tidak ditemukan.",
            code: "not_found",
            errors: {},
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    await expect(apiRequest("pages/tidak-ada/")).rejects.toMatchObject({
      status: 404,
      code: "not_found",
    });
  });
});
