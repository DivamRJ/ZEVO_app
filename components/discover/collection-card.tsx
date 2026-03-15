"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type CollectionCardProps = {
  sport: string;
  icon: string;
  tone: string;
  count: number;
};

export function CollectionCard({ sport, icon, tone, count }: CollectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={`/discover?sport=${encodeURIComponent(sport)}`}
        className="group relative block overflow-hidden glass-card p-5"
      >
        {/* Gradient background */}
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone} opacity-30 transition-opacity duration-300 group-hover:opacity-50 rounded-2xl`} />

        <div className="relative">
          <div className="flex items-start justify-between">
            <span className="text-3xl">{icon}</span>
            <span className="rounded-full border border-zinc-700/60 bg-zinc-800/50 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
              {count} {count === 1 ? "arena" : "arenas"}
            </span>
          </div>

          <h3 className="mt-3 text-base font-bold text-zinc-100">{sport}</h3>
          <p className="mt-1 text-xs text-zinc-400">
            Browse all {sport.toLowerCase()} arenas
          </p>

          <p className="mt-3 text-[11px] font-semibold text-neon transition-transform duration-200 group-hover:translate-x-1">
            View collection →
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
