"use client";

import { useEffect, useState } from "react";
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
  const [redirectOnSession, setRedirectOnSession] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!redirectOnSession) return;
    router.push("/chat");
    router.refresh();
  }, [loading, redirectOnSession, user, router]);

  const onSignUp = async () => {
    if (submitting) return;
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setStatus("Email and password are required.");
      return;
    }

    try {
      setSubmitting(true);
      setRedirectOnSession(true);
      console.log("Attempting signup for:", cleanEmail);
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password
      });

      if (error) {
        console.log("Supabase signup error:", error.message, error);
        if (error.message.toLowerCase().includes("email rate limit exceeded")) {
          setStatus("Account created! Please wait 5 minutes before your first login due to security limits.");
          setRedirectOnSession(false);
          setSubmitting(false);
          return;
        }
        setStatus(error.message);
        setRedirectOnSession(false);
        setSubmitting(false);
        return;
      }

      if (data.user) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (signInError) {
          console.log("Supabase auto-login after signup error:", signInError.message, signInError);
          if (signInError.message.toLowerCase().includes("email rate limit exceeded")) {
            setStatus("Account created! Please wait 5 minutes before your first login due to security limits.");
            setRedirectOnSession(false);
            setSubmitting(false);
            return;
          }
          setStatus(signInError.message);
          setRedirectOnSession(false);
          setSubmitting(false);
          return;
        }
      }

      setStatus("Welcome to Zevo!");
      setSubmitting(false);
      router.push("/chat");
      router.refresh();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : String(caughtError);
      console.log("Supabase signup catch error:", message, caughtError);
      if (message.toLowerCase().includes("email rate limit exceeded")) {
        setStatus("Account created! Please wait 5 minutes before your first login due to security limits.");
        setRedirectOnSession(false);
        setSubmitting(false);
        return;
      }
      setStatus(message);
      setRedirectOnSession(false);
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

    setSubmitting(true);
    setRedirectOnSession(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });
    setSubmitting(false);

    if (error) {
      setStatus(error.message);
      setRedirectOnSession(false);
      return;
    }

    router.push("/chat");
    router.refresh();
  };

  const onLogOut = async () => {
    if (submitting) return;
    setSubmitting(true);
    setRedirectOnSession(false);
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
