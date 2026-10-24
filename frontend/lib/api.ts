import { getAccountSignal, localStore, setAccountScope } from "./browser-storage";

export type AuthUser = {
  id: string;
  username: string;
  display_name: string;
  email?: string;
  created_at: string;
  is_admin?: boolean;
};

export type AuthResponse = { status: string; message: string; user: AuthUser };

export class ApiRequestError extends Error {
  constructor(public status: number, public detail: string) {
    super(detail || `请求失败（${status}）`);
    this.name = "ApiRequestError";
  }
}

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let authGeneration = 0;

/** All browser requests go through the same-origin Next.js proxy. */
export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!/^\/api\/(auth|attackpilot)\//.test(path) || path.includes("\\")) {
    throw new Error("请求必须使用 /api/auth/ 或 /api/attackpilot/ 路径。");
  }
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (unsafeMethods.has(method)) headers.set("X-CryptoRisk-CSRF", "1");
  const translation = method === "POST" && /\/report-translation(?:\?|$)/.test(path);
  const signals = [AbortSignal.timeout(translation ? 300_000 : 120_000)];
  if (init.signal) signals.push(init.signal);
  if (path.startsWith("/api/attackpilot/")) signals.push(getAccountSignal());
  const response = await fetch(path, {
    ...init, method, headers, cache: "no-store", credentials: "same-origin",
    signal: AbortSignal.any(signals),
  });
  if (!response.ok) {
    let detail = "";
    try {
      const payload = await response.json() as { detail?: unknown };
      detail = typeof payload.detail === "string" ? payload.detail
        : Array.isArray(payload.detail) ? payload.detail.map((item: { msg?: string }) => item?.msg || "参数无效").join("；") : "";
    } catch { /* The proxy may return a non-JSON error while the backend is unavailable. */ }
    throw new ApiRequestError(response.status, detail);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function applyAuthUser(user: AuthUser | null) {
  setAccountScope(user?.id ?? null);
  return user;
}

function notifyAuthChange() {
  localStore.setItem("cryptorisk.auth.version", `${Date.now()}:${authGeneration}`);
}

export async function fetchCurrentUser() {
  const generation = authGeneration;
  const user = await requestJson<AuthUser | null>("/api/auth/me");
  if (generation !== authGeneration) throw new DOMException("登录状态已更新", "AbortError");
  return applyAuthUser(user);
}

async function authenticate(action: "login" | "register", username: string, password: string) {
  authGeneration += 1;
  const response = await requestJson<AuthResponse>(`/api/auth/${action}`, {
    method: "POST", body: JSON.stringify({ username, password }),
  });
  applyAuthUser(response.user);
  notifyAuthChange();
  return response;
}

export const loginUser = (username: string, password: string) => authenticate("login", username, password);
export const registerUser = (username: string, password: string) => authenticate("register", username, password);

export async function logoutUser() {
  authGeneration += 1;
  const response = await requestJson<{ status: string; message: string }>("/api/auth/logout", { method: "POST" });
  applyAuthUser(null);
  notifyAuthChange();
  return response;
}
