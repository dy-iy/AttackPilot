/** Keep per-account requests and drafts separate, even when storage is disabled. */
export const accountScopeEvent = "cryptorisk:account-scope-changed";
export const storageWarningEvent = "cryptorisk:storage-warning";
let accountScope = "guest";
let accountController = new AbortController();
let storageUnavailable = false;

export const getAccountScope = () => accountScope;
export const getAccountSignal = () => accountController.signal;
export const hasStorageWarning = () => storageUnavailable;

export function setAccountScope(userId: string | null) {
  const next = userId || "guest";
  if (next === accountScope) return;
  accountController.abort();
  accountController = new AbortController();
  accountScope = next;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(accountScopeEvent));
}

function createStorage(kind: "localStorage" | "sessionStorage") {
  const fallback = new Map<string, string | null>();
  function warn() {
    if (storageUnavailable) return;
    storageUnavailable = true;
    if (typeof window !== "undefined") window.dispatchEvent(new Event(storageWarningEvent));
  }
  return {
    getItem(key: string): string | null {
      if (typeof window === "undefined") return null;
      if (fallback.has(key)) return fallback.get(key) ?? null;
      try { return window[kind].getItem(key); }
      catch { warn(); return null; }
    },
    setItem(key: string, value: string) {
      if (typeof window === "undefined") return;
      try { window[kind].setItem(key, value); fallback.delete(key); }
      catch { fallback.set(key, value); warn(); }
    },
    removeItem(key: string) {
      if (typeof window === "undefined") return;
      try { window[kind].removeItem(key); fallback.delete(key); }
      catch { fallback.set(key, null); warn(); }
    },
  };
}

export const localStore = createStorage("localStorage");
export const sessionStore = createStorage("sessionStorage");
