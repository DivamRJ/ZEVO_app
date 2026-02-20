"use client";

import Link from "next/link";

import { SparklesCore } from "@/components/ui/sparkles";

export function SparklesPreview() {
  return (
    <div className="relative mb-10 flex min-h-[34rem] w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-zinc-800 bg-black px-6">
      <h1 className="relative z-20 text-center text-5xl font-black tracking-tight text-white sm:text-7xl lg:text-9xl">ZEVO</h1>

      <div className="relative mt-6 h-44 w-full max-w-3xl">
        <div className="absolute inset-x-20 top-0 h-[2px] w-3/4 bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-sm" />
        <div className="absolute inset-x-20 top-0 h-px w-3/4 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
        <div className="absolute inset-x-60 top-0 h-[5px] w-1/4 bg-gradient-to-r from-transparent via-sky-500 to-transparent blur-sm" />
        <div className="absolute inset-x-60 top-0 h-px w-1/4 bg-gradient-to-r from-transparent via-sky-500 to-transparent" />

        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={1200}
          className="h-full w-full"
          particleColor="#FFFFFF"
        />

        <div className="absolute inset-0 h-full w-full bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]" />
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
