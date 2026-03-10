"use client";

import type { TurfApi } from "@/lib/api-client";

type TurfCardProps = {
  turf: TurfApi;
  selected: boolean;
  onSelect: (turf: TurfApi) => void;
};

export function TurfCard({ turf, selected, onSelect }: TurfCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(turf)}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-neon bg-neon/10"
          : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-600"
      }`}
    >
      <p className="text-sm font-semibold text-zinc-100">{turf.location}</p>
      <p className="mt-1 text-xs text-zinc-400">Turf ID: {turf.turf_id}</p>
      <p className="mt-2 text-sm text-zinc-300">Price/hour: Rs. {turf.price_per_hour}</p>
      <p className="text-xs text-zinc-500">Timezone: {turf.timezone}</p>
      <p className="text-xs text-zinc-500">Owner: {turf.owner_name ?? "Unassigned"}</p>
    </button>
  );
}
