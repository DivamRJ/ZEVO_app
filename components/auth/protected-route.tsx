"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: Array<"PLAYER" | "OWNER" | "ADMIN">;
  redirectTo?: string;
};

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/profile"
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace("/");
    }
  }, [allowedRoles, isAuthenticated, loading, redirectTo, router, user]);

  if (loading) {
    return <p className="text-sm text-zinc-400">Checking your session...</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
