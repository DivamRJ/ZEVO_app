"use client";

import Link from "next/link";
import { useState } from "react";

import { PageShell } from "@/components/zevo/page-shell";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/lib/supabase/client";

export default function AuthPage() {
  const { user, loading } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Sign up or log in to access Zevo chat and protected features.");
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

    setStatus("Signup successful. Check your email if verification is enabled.");
  };

  const onLogIn = async () => {
    if (!email.trim() || !password.trim()) {
      setStatus("Email and password are required.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    setSubmitting(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus(`Logged in as ${email.trim()}`);
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
    <PageShell>
      <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
        <h1 className="text-3xl font-black">Auth</h1>
        <p className="mt-2 text-sm text-zinc-400">Create an account or login with email/password.</p>
        <p className="mt-3 text-xs text-zinc-300">{loading ? "Checking session..." : status}</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="text-lg font-semibold">Login / Signup</h2>
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

        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="text-lg font-semibold">Current Session</h2>
          {user ? (
            <div className="mt-3 space-y-1 text-sm text-zinc-300">
              <p>User ID: {user.id}</p>
              <p>Email: {user.email ?? "No email"}</p>
              <Link href="/chat" className="mt-3 inline-block rounded-xl bg-neon px-4 py-2 text-xs font-bold text-zinc-900">
                Go to Public Chat
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-400">No active session. Please login to continue.</p>
          )}
        </article>
      </section>
    </PageShell>
  );
}
