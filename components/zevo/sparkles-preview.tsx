"use client";

import Link from "next/link";

import { SparklesCore } from "@/components/ui/sparkles";

export function SparklesPreview() {
  return (
    <div className="relative mb-10 flex min-h-[34rem] w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 px-6">
      <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-56 w-56 rounded-full bg-violet-400/15 blur-3xl" />
      <SparklesCore
        background="transparent"
        minSize={0.35}
        maxSize={1}
        particleDensity={1500}
        className="absolute inset-0 h-full w-full opacity-40"
        particleColor="#67E8F9"
      />
      <SparklesCore
        background="transparent"
        minSize={0.3}
        maxSize={0.9}
        particleDensity={1100}
        className="absolute inset-0 h-full w-full opacity-30"
        particleColor="#C4B5FD"
      />

      <div className="relative flex h-56 w-full max-w-5xl items-center justify-center overflow-hidden rounded-2xl border border-zinc-700/70 bg-zinc-900/40">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-violet-500/10" />
        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={1400}
          className="absolute inset-0 h-full w-full"
          particleColor="#67E8F9"
        />
        <SparklesCore
          background="transparent"
          minSize={0.3}
          maxSize={0.9}
          particleDensity={1000}
          className="absolute inset-0 h-full w-full opacity-70"
          particleColor="#C4B5FD"
        />
        <h1 className="relative z-20 text-center text-5xl font-black tracking-[0.08em] text-transparent bg-gradient-to-r from-cyan-300 via-lime-200 to-violet-300 bg-clip-text drop-shadow-[0_0_22px_rgba(103,232,249,0.45)] sm:text-7xl lg:text-9xl">
          ZEVO
        </h1>
      </div>

      <Link
        href="/about"
        className="relative z-20 mt-5 rounded-xl bg-neon px-5 py-2 text-sm font-bold text-zinc-900 hover:brightness-95"
      >
        More Info
      </Link>
    </div>
  );
}
