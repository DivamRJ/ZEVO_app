"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-800/70 bg-zinc-900/60 p-6 shadow-glass backdrop-blur-xl sm:p-8">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#8b5cf6]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-[#d9f99d]/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative z-10 space-y-5"
      >
        <p className="inline-flex rounded-full border border-[#8b5cf6]/50 bg-[#8b5cf6]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-[#c4b5fd]">
          TurfTown
        </p>
        <h1 className="max-w-lg text-4xl font-black leading-tight tracking-tight text-zinc-100 sm:text-5xl">
          Don&apos;t Just Watch. Play.
        </h1>
        <p className="max-w-md text-sm text-zinc-300 sm:text-base">
          Find games. Build your squad. Earn rep.
        </p>

        <Button size="lg" className="bg-[#d9f99d] text-black hover:bg-[#ecfccb]">
          Find a Match Near Me
        </Button>
      </motion.div>
    </section>
  );
}
