"use client";

import { useEffect, useState } from "react";

import { getTheme, setTheme } from "@/lib/zevo-storage";

export function ThemeToggle() {
  const [theme, setThemeState] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const initial = getTheme();
    setThemeState(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed bottom-5 right-5 z-50 rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-xs font-semibold text-zinc-100 shadow-lg backdrop-blur hover:border-zinc-500"
      aria-label="Toggle theme mode"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="text-base leading-none" aria-hidden="true">
        {theme === "dark" ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
