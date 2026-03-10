"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";

type AuthPanelProps = {
  title?: string;
  subtitle?: string;
  className?: string;
};

export function AuthPanel({
  title = "Login / Signup",
  subtitle = "Use your email and password to access ZEVO chat and protected features.",
  className = ""
}: AuthPanelProps) {
  const router = useRouter();
  const { user, loading, loginUser, signupUser, logoutUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Create an account or log in to continue.");
  const [submitting, setSubmitting] = useState(false);
  const [redirectOnSession, setRedirectOnSession] = useState(false);

  useEffect(() => {
    if (loading || !user || !redirectOnSession) return;
    router.push("/chat");
    router.refresh();
  }, [loading, redirectOnSession, user, router]);

  const getAuthErrorMessage = (caughtError: unknown) => {
    const message = caughtError instanceof Error ? caughtError.message : String(caughtError);
    const normalized = message.toLowerCase();

    if (normalized.includes("failed to fetch") || normalized.includes("network error")) {
      return "Unable to reach backend auth service. Ensure backend is running and NEXT_PUBLIC_BACKEND_URL is correct.";
    }

    return message;
  };

  const onSignUp = async () => {
    if (submitting) return;

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail || !password) {
      setStatus("Name, email, and password are required.");
      return;
    }

    try {
      setSubmitting(true);
      setRedirectOnSession(true);
      await signupUser({ name: cleanName, email: cleanEmail, password, role: "PLAYER" });
      setStatus("Account created. Redirecting to chat...");
      router.push("/chat");
      router.refresh();
    } catch (caughtError) {
      setStatus(getAuthErrorMessage(caughtError));
      setRedirectOnSession(false);
    } finally {
      setSubmitting(false);
    }
  };

  const onLogIn = async () => {
    if (submitting) return;

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setStatus("Email and password are required.");
      return;
    }

    try {
      setSubmitting(true);
      setRedirectOnSession(true);
      await loginUser({ email: cleanEmail, password });
      setStatus("Logged in. Redirecting to chat...");
      router.push("/chat");
      router.refresh();
    } catch (caughtError) {
      setStatus(getAuthErrorMessage(caughtError));
      setRedirectOnSession(false);
    } finally {
      setSubmitting(false);
    }
  };

  const onLogOut = () => {
    if (submitting) return;
    setRedirectOnSession(false);
    logoutUser();
    setStatus("Logged out successfully.");
    router.refresh();
  };

  return (
    <article className={`rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 ${className}`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
      <p className="mt-2 text-xs text-zinc-300">
        {loading ? "Checking session..." : user ? `Logged in as ${user.email}` : status}
      </p>

      <div className="mt-3 space-y-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          type="text"
          placeholder="Name (for sign up)"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-neon"
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="Email"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-neon"
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="Password"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-neon"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onLogIn}
            disabled={submitting}
            className="rounded-xl bg-neon px-4 py-2 text-sm font-bold text-zinc-900 disabled:opacity-60"
          >
            Log In
          </button>
          <button
            type="button"
            onClick={onSignUp}
            disabled={submitting}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-500 disabled:opacity-60"
          >
            Sign Up
          </button>
          {user ? (
            <button
              type="button"
              onClick={onLogOut}
              disabled={submitting}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-500 disabled:opacity-60"
            >
              Log Out
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
