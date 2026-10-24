"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "antd";
import { fetchCurrentUser, logoutUser, type AuthUser } from "@/lib/api";
import { setAccountScope } from "@/lib/browser-storage";
import AuthDialog from "./auth-dialog";
import AttackPilotWorkbench from "./attackpilot/workbench";
import { errorMessage } from "./attackpilot/services/api";

/** Auth lives in the shared route layout, independently of the original dashboard. */
export default function AttackPilotShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const revision = useRef(0);

  const refreshSession = useCallback(async () => {
    const current = ++revision.current;
    setAuthLoading(true);
    try {
      const next = await fetchCurrentUser();
      if (current === revision.current) { setUser(next); setAuthError(""); }
    } catch (reason) {
      if (current === revision.current && !(reason instanceof Error && reason.name === "AbortError")) {
        setAuthError("登录状态暂时无法确认，请检查后端连接后刷新页面。");
      }
    } finally { if (current === revision.current) setAuthLoading(false); }
  }, []);

  useEffect(() => {
    void refreshSession();
    const requireLogin = () => {
      revision.current += 1;
      setAccountScope(null);
      setUser(null);
      setAuthLoading(false);
      setAuthOpen(true);
    };
    const syncSession = (event: StorageEvent) => {
      if (event.key === "cryptorisk.auth.version") void refreshSession();
    };
    window.addEventListener("attackpilot:login", requireLogin);
    window.addEventListener("storage", syncSession);
    return () => {
      revision.current += 1;
      window.removeEventListener("attackpilot:login", requireLogin);
      window.removeEventListener("storage", syncSession);
    };
  }, [refreshSession]);

  async function logout() {
    const current = ++revision.current;
    setAuthLoading(true);
    setAuthError("");
    try { await logoutUser(); if (current === revision.current) setUser(null); }
    catch (reason) { if (current === revision.current) setAuthError(errorMessage(reason)); }
    finally { if (current === revision.current) setAuthLoading(false); }
  }

  return <AttackPilotWorkbench userId={user?.id ?? null} userName={user?.display_name || user?.username}
    authLoading={authLoading} onLogin={() => setAuthOpen(true)} onLogout={() => void logout()}>
    {children}
    {authError && <Alert className="ap-auth-connection-alert" showIcon type="warning" title={authError}
      closable onClose={() => setAuthError("")} />}
    <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} onAuthenticated={next => {
      revision.current += 1;
      setUser(next);
      setAuthLoading(false);
      setAuthError("");
      setAuthOpen(false);
    }} />
  </AttackPilotWorkbench>;
}
