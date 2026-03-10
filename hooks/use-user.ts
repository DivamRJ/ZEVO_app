"use client";

import { useAuth } from "@/context/auth-context";

export function useUser() {
  const { user, token, loading, isAuthenticated } = useAuth();

  return {
    user,
    session: token ? { token, user } : null,
    loading,
    isAuthenticated
  };
}
