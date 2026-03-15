"use client";

import { motion } from "framer-motion";
import type { TurfRow } from "@/app/bookings/page";
import { SPORT_COLLAGE } from "@/lib/zevo-data";

type TurfCardProps = {
  turf: TurfRow;
  selected: boolean;
  onSelect: (turf: TurfRow) => void;
};

function getSportIcon(name: string) {
  const match = SPORT_COLLAGE.find((s) =>
    name.toLowerCase().includes(s.sport.toLowerCase())
  );
  return match?.icon ?? "🏟️";
}

function getPriceTier(price: number) {
  if (price <= 500) return { label: "Budget", bar: "w-1/4", color: "bg-emerald-400" };
  if (price <= 1000) return { label: "Standard", bar: "w-1/2", color: "bg-sky-400" };
  if (price <= 2000) return { label: "Premium", bar: "w-3/4", color: "bg-amber-400" };
  return { label: "Elite", bar: "w-full", color: "bg-violet-400" };
}

export function TurfCard({ turf, selected, onSelect }: TurfCardProps) {
  const icon = getSportIcon(turf.name);
  const tier = getPriceTier(turf.price_per_hour);

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(turf)}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
        selected
          ? "border-neon/50 bg-neon/10 shadow-neon-glow"
          : "glass-card-glow hover:border-zinc-600"
      }`}
    >
      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-neon/5 via-transparent to-violet-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <span className="text-2xl">{icon}</span>
          {selected && (
            <span className="rounded-full border border-neon/40 bg-neon/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neon">
              Selected
            </span>
          )}
        </div>

        <p className="mt-3 text-sm font-semibold text-zinc-100">{turf.name}</p>
        <p className="mt-1 text-xs text-zinc-400">{turf.location}</p>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-base font-bold text-zinc-200">
            ₹{turf.price_per_hour}
            <span className="ml-1 text-xs font-normal text-zinc-500">/hr</span>
          </p>
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {turf.time_zone}
          </span>
        </div>

        {/* Price tier indicator */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-zinc-500">{tier.label}</span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
            <div className={`h-full rounded-full ${tier.color} ${tier.bar} transition-all duration-500`} />
          </div>
        </div>
      </div>
    </motion.button>
  );
}
