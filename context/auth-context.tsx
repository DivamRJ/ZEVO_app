 "use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

import { createClient } from "@/utils/supabase/client";

type ZevoUserRole = "PLAYER" | "OWNER" | "ADMIN";

export type ZevoUser = {
  id: string;
  name: string;
  email: string;
  role: ZevoUserRole;
  walletBalance: number;
  city: string | null;
  skillLevel: string;
  interests: string[];
};

type AuthSessionState = {
  token: string | null;
  user: ZevoUser | null;
};

type AuthContextValue = {
  user: ZevoUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  setCurrentUser: (user: ZevoUser) => void;
  refreshCurrentUser: () => Promise<void>;
  loginUser: (input: { email: string; password: string }) => Promise<void>;
  signupUser: (input: { name: string; email: string; password: string; role?: ZevoUserRole }) => Promise<void>;
  logoutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapProfileToZevoUser(authUser: SupabaseUser, profile: any): ZevoUser {
  return {
    id: authUser.id,
    email: authUser.email ?? profile?.email ?? "",
    name: profile?.display_name ?? authUser.user_metadata?.name ?? authUser.email ?? "ZEVO User",
    role: (profile?.role as ZevoUserRole) ?? "PLAYER",
    walletBalance: Number(profile?.wallet_balance ?? 0),
    city: profile?.city ?? null,
    skillLevel: profile?.skill_level ?? "Beginner",
    interests: Array.isArray(profile?.interests) ? profile.interests : []
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSessionState>({ token: null, user: null });
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const hydrateFromSession = useCallback(
    async (supabaseSession: Session | null) => {
      if (!supabaseSession?.user) {
        setSession({ token: null, user: null });
        return;
      }

      const authUser = supabaseSession.user;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, role, wallet_balance, city, skill_level, interests")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) {
        // If profile lookup fails, still keep basic auth identity.
        const fallbackUser: ZevoUser = {
          id: authUser.id,
          email: authUser.email ?? "",
          name: authUser.user_metadata?.name ?? authUser.email ?? "ZEVO User",
          role: "PLAYER",
          walletBalance: 0,
          city: null,
          skillLevel: "Beginner",
          interests: []
        };

        setSession({
          token: supabaseSession.access_token ?? null,
          user: fallbackUser
        });

        return;
      }

      const zevoUser = mapProfileToZevoUser(authUser, profile);

      setSession({
        token: supabaseSession.access_token ?? null,
        user: zevoUser
      });
    },
    [supabase]
  );

  const refreshCurrentUser = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setSession({ token: null, user: null });
      return;
    }

    await hydrateFromSession(data.session);
  }, [supabase, hydrateFromSession]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          if (isMounted) {
            setSession({ token: null, user: null });
          }
          return;
        }

        if (isMounted) {
          await hydrateFromSession(data.session);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void init();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      void hydrateFromSession(newSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, hydrateFromSession]);

  const loginUser = useCallback(
    async (input: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password
      });

      if (error) {
        throw error;
      }

      await hydrateFromSession(data.session);
    },
    [supabase, hydrateFromSession]
  );

  const signupUser = useCallback(
    async (input: { name: string; email: string; password: string; role?: ZevoUserRole }) => {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            name: input.name,
            role: input.role ?? "PLAYER"
          }
        }
      });

      if (error) {
        throw error;
      }

      await hydrateFromSession(data.session);
    },
    [supabase, hydrateFromSession]
  );

  const logoutUser = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setSession({ token: null, user: null });
  }, [supabase]);

  const setCurrentUser = useCallback((user: ZevoUser) => {
    setSession((current) => ({
      token: current.token,
      user
    }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session.user,
      token: session.token,
      loading,
      isAuthenticated: Boolean(session.user),
      setCurrentUser,
      refreshCurrentUser,
      loginUser,
      signupUser,
      logoutUser
    }),
    [session, loading, setCurrentUser, refreshCurrentUser, loginUser, signupUser, logoutUser]
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
