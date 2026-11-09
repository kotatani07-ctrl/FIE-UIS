const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_API_BASE = "/api/v1/";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly errors: Record<string, string[]> = {},
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
};

function resolveApiUrl(path: string): URL {
  const configuredBase = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE;
  const basePath = configuredBase.endsWith("/")
    ? configuredBase
    : `${configuredBase}/`;

  if (!basePath.startsWith("/api/v1/") || basePath.startsWith("//")) {
    throw new Error("VITE_API_BASE_URL harus berada di origin yang sama.");
  }
  if (!path || path.startsWith("/") || path.split("/").includes("..")) {
    throw new Error("Path API tidak valid.");
  }

  const origin = window.location.origin;
  const base = new URL(basePath, origin);
  const url = new URL(path, base);
  if (url.origin !== origin || !url.pathname.startsWith(base.pathname)) {
    throw new Error("Permintaan API harus tetap pada origin yang diizinkan.");
  }
  return url;
}

function isApiErrorBody(value: unknown): value is {
  detail: string;
  code: string;
  errors: Record<string, string[]>;
} {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  if (
    typeof body.detail !== "string" ||
    typeof body.code !== "string" ||
    typeof body.errors !== "object" ||
    body.errors === null
  ) {
    return false;
  }
  return Object.values(body.errors).every(
    (messages) =>
      Array.isArray(messages) &&
      messages.every((message) => typeof message === "string"),
  );
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  if (method === "POST" && path.split("?")[0] !== "contact/") {
    throw new Error("POST hanya diizinkan untuk formulir kontak.");
  }
  if (method === "GET" && options.body !== undefined) {
    throw new Error("Permintaan GET tidak boleh memiliki body.");
  }

  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) {
    abortFromCaller();
  } else {
    options.signal?.addEventListener("abort", abortFromCaller, { once: true });
  }
  const timeoutId = window.setTimeout(
    () =>
      controller.abort(
        new DOMException("Waktu permintaan habis.", "TimeoutError"),
      ),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(resolveApiUrl(path), {
      method,
      headers: {
        Accept: "application/json",
        ...(options.body === undefined
          ? {}
          : { "Content-Type": "application/json" }),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "omit",
      mode: "same-origin",
      redirect: "error",
      referrerPolicy: "same-origin",
      signal: controller.signal,
    });

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ApiError(
          "Respons server bukan JSON yang valid.",
          response.status,
          "invalid_response",
          {},
          { cause: error },
        );
      }
      throw error;
    }

    if (!response.ok) {
      if (isApiErrorBody(responseBody)) {
        throw new ApiError(
          responseBody.detail,
          response.status,
          responseBody.code,
          responseBody.errors,
        );
      }
      throw new ApiError(
        "Permintaan tidak dapat diproses.",
        response.status,
        "http_error",
      );
    }
    return responseBody as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (controller.signal.aborted) {
      throw new ApiError(
        "Permintaan ke server dibatalkan atau melewati batas waktu.",
        0,
        "request_aborted",
        {},
        { cause: error },
      );
    }
    if (error instanceof TypeError) {
      throw new ApiError(
        "Server API tidak dapat dijangkau.",
        0,
        "network_error",
        {},
        { cause: error },
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
}
