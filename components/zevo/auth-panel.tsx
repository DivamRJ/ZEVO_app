"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, UserPlus, LogOut, Loader2, Shield } from "lucide-react";

import { useAuth } from "@/context/auth-context";

type AuthPanelProps = {
  title?: string;
  subtitle?: string;
  className?: string;
};

export function AuthPanel({
  title = "Login / Signup",
  subtitle = "Use your email and password to access ZEVO.",
  className = "",
}: AuthPanelProps) {
  const router = useRouter();
  const { user, loading, loginUser, signupUser, logoutUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Create an account or log in to continue.");
  const [submitting, setSubmitting] = useState(false);
  const [redirectOnSession, setRedirectOnSession] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    if (loading || !user || !redirectOnSession) return;
    router.push("/discover");
    router.refresh();
  }, [loading, redirectOnSession, user, router]);

  const getAuthErrorMessage = (caughtError: unknown) => {
    const message = caughtError instanceof Error ? caughtError.message : String(caughtError);
    if (message.includes("Invalid login")) return "Invalid email or password. Please try again.";
    if (message.includes("already registered")) return "This email is already registered. Try logging in.";
    if (message.includes("Password should be")) return "Password must be at least 6 characters.";
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
      setStatus("Account created! Redirecting…");
      router.push("/discover");
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
      setStatus("Logged in! Redirecting…");
      router.push("/discover");
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

  // Logged-in state
  if (user) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card p-5 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon/15 text-lg font-black text-neon">
              {user.name?.charAt(0)?.toUpperCase() || "Z"}
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-100">{user.name}</p>
              <p className="text-xs text-zinc-500">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-neon/30 bg-neon/10 px-2 py-0.5 text-[10px] font-semibold text-neon">
              {user.role}
            </span>
            <button type="button" onClick={onLogOut} className="btn-secondary flex items-center gap-1.5 text-xs">
              <LogOut size={12} /> Logout
            </button>
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel p-6 ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg bg-neon/15 p-2"><Shield size={18} className="text-neon" /></div>
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-xs text-zinc-400">{subtitle}</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="mb-4 flex rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-300 ${
            mode === "login" ? "bg-neon text-zinc-900 shadow-[0_2px_8px_rgba(204,255,0,0.2)]" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Log In
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-300 ${
            mode === "signup" ? "bg-neon text-zinc-900 shadow-[0_2px_8px_rgba(204,255,0,0.2)]" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Sign Up
        </button>
      </div>

      <p className="mb-3 text-xs text-zinc-400">
        {loading ? "Checking session…" : status}
      </p>

      <div className="space-y-3">
        {mode === "signup" && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="Full name"
            className="input-field"
          />
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email address"
          className="input-field"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          className="input-field"
          onKeyDown={(e) => {
            if (e.key === "Enter") mode === "login" ? onLogIn() : onSignUp();
          }}
        />

        <button
          type="button"
          onClick={mode === "login" ? onLogIn : onSignUp}
          disabled={submitting}
          className="btn-primary flex w-full items-center justify-center gap-2"
        >
          {submitting ? (
            <><Loader2 size={14} className="animate-spin" /> {mode === "login" ? "Logging in…" : "Creating account…"}</>
          ) : mode === "login" ? (
            <><LogIn size={14} /> Log In</>
          ) : (
            <><UserPlus size={14} /> Create Account</>
          )}
        </button>

        <p className="text-center text-xs text-zinc-500">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="font-semibold text-neon">
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </motion.article>
  );
}
