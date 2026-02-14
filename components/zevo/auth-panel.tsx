"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useUser } from "@/hooks/use-user";
import { supabase } from "@/lib/supabase/client";

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
  const { user, loading } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Create an account or log in to continue.");
  const [submitting, setSubmitting] = useState(false);

  const onSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      setStatus("Email and password are required.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password
    });
    setSubmitting(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Signup successful. Check your inbox if email verification is enabled.");
  };

  const onLogIn = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setStatus("Email and password are required.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });
    setSubmitting(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    router.push("/chat");
    router.refresh();
  };

  const onLogOut = async () => {
    setSubmitting(true);
    const { error } = await supabase.auth.signOut();
    setSubmitting(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Logged out successfully.");
  };

  return (
    <article className={`rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 ${className}`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
      <p className="mt-2 text-xs text-zinc-300">
        {loading ? "Checking session..." : user ? `Logged in as ${user.email ?? "ZEVO user"}` : status}
      </p>

      <div className="mt-3 space-y-3">
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
