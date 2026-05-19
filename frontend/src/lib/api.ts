import { clearToken, getToken } from "./auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") ?? "http://localhost:8000";
const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  code: string;
  status: number;
  extras: Record<string, unknown>;

  constructor(status: number, code: string, message: string, extras: Record<string, unknown> = {}) {
    super(message || code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.extras = extras;
  }
}

type Json = unknown;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: Json | FormData;
  query?: Record<string, string | number | boolean | null | undefined>;
  signal?: AbortSignal;
  auth?: boolean;
  headers?: Record<string, string>;
};

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const full = `${API_BASE}${API_PREFIX}${normalized}`;
  if (!query) return full;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === null || v === undefined) continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${full}?${qs}` : full;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, query, signal, auth = true, headers = {} } = opts;

  const finalHeaders: Record<string, string> = { Accept: "application/json", ...headers };
  let payload: BodyInit | undefined;

  if (body !== undefined) {
    if (body instanceof FormData) {
      payload = body;
    } else {
      finalHeaders["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers: finalHeaders,
      body: payload,
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    // 네트워크 자체 실패 → 글로벌 토스트
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("hifive:toast", {
          detail: { message: "네트워크 연결을 확인해주세요", level: "error" },
        }),
      );
    }
    throw new ApiError(0, "NETWORK_ERROR", "네트워크 연결에 실패했어요");
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    if (res.status === 401 && auth) clearToken();
    if (isJson && data && typeof data === "object" && "error" in (data as Record<string, unknown>)) {
      const err = (data as { error: { code?: string; message?: string; [k: string]: unknown } }).error;
      const { code = `HTTP_${res.status}`, message = "", ...extras } = err ?? {};
      throw new ApiError(res.status, code, message, extras);
    }
    throw new ApiError(res.status, `HTTP_${res.status}`, typeof data === "string" ? data : "");
  }

  return data as T;
}

export const api = {
  get: <T = unknown>(path: string, opts: Omit<RequestOptions, "method" | "body"> = {}) =>
    apiFetch<T>(path, { ...opts, method: "GET" }),
  post: <T = unknown>(path: string, body?: Json | FormData, opts: Omit<RequestOptions, "method" | "body"> = {}) =>
    apiFetch<T>(path, { ...opts, method: "POST", body }),
  put: <T = unknown>(path: string, body?: Json | FormData, opts: Omit<RequestOptions, "method" | "body"> = {}) =>
    apiFetch<T>(path, { ...opts, method: "PUT", body }),
  patch: <T = unknown>(path: string, body?: Json | FormData, opts: Omit<RequestOptions, "method" | "body"> = {}) =>
    apiFetch<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T = unknown>(path: string, opts: Omit<RequestOptions, "method" | "body"> = {}) =>
    apiFetch<T>(path, { ...opts, method: "DELETE" }),
};
