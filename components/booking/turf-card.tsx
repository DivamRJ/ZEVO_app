 "use client";

import type { TurfRow } from "@/app/bookings/page";

type TurfCardProps = {
  turf: TurfRow;
  selected: boolean;
  onSelect: (turf: TurfRow) => void;
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
      <p className="text-sm font-semibold text-zinc-100">{turf.name}</p>
      <p className="mt-1 text-xs text-zinc-400">{turf.location}</p>
      <p className="mt-1 text-xs text-zinc-400">Turf ID: {turf.id}</p>
      <p className="mt-2 text-sm text-zinc-300">Price/hour: Rs. {turf.price_per_hour}</p>
      <p className="text-xs text-zinc-500">Timezone: {turf.time_zone}</p>
    </button>
  );
}
