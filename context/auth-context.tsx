"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  clearStoredAuthSession,
  getCurrentUser,
  getStoredAuthSession,
  login,
  signup,
  type AuthSession,
  type AuthUser
} from "@/lib/api-client";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginUser: (input: { email: string; password: string }) => Promise<void>;
  signupUser: (input: { name: string; email: string; password: string; role?: "PLAYER" | "OWNER" }) => Promise<void>;
  logoutUser: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrateSession = useCallback(async () => {
    const stored = getStoredAuthSession();

    if (!stored) {
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      const user = await getCurrentUser();
      setSession({ token: stored.token, user });
    } catch (error) {
      clearStoredAuthSession();
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrateSession();

    const onSessionChange = () => {
      void hydrateSession();
    };

    window.addEventListener("storage", onSessionChange);
    window.addEventListener("zevo-auth-changed", onSessionChange as EventListener);

    return () => {
      window.removeEventListener("storage", onSessionChange);
      window.removeEventListener("zevo-auth-changed", onSessionChange as EventListener);
    };
  }, [hydrateSession]);

  const loginUser = useCallback(async (input: { email: string; password: string }) => {
    const auth = await login(input);
    setSession(auth);
  }, []);

  const signupUser = useCallback(
    async (input: { name: string; email: string; password: string; role?: "PLAYER" | "OWNER" }) => {
      const auth = await signup(input);
      setSession(auth);
    },
    []
  );

  const logoutUser = useCallback(() => {
    clearStoredAuthSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      loading,
      isAuthenticated: Boolean(session?.token),
      loginUser,
      signupUser,
      logoutUser
    }),
    [session, loading, loginUser, signupUser, logoutUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
