 "use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageShell } from "@/components/zevo/page-shell";
import { createClient } from "@/utils/supabase/client";

type TurfRow = {
  id: string;
  name: string;
  location: string;
  price_per_hour: number;
  time_zone: string;
};

function getCity(location: string) {
  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || "Unknown";
}

function getArenaDescription(turf: TurfRow) {
  return `${turf.name} is available at ${turf.location}. Pricing starts at Rs. ${turf.price_per_hour} per hour. Select this arena to view live availability and lock a slot.`;
}

export default function DiscoverPage() {
  const [turfs, setTurfs] = useState<TurfRow[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [expandedArenaId, setExpandedArenaId] = useState<string | null>(null);
  const [status, setStatus] = useState("Loading arenas from backend...");

  useEffect(() => {
    const loadTurfs = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("turfs")
          .select("id, name, location, price_per_hour, time_zone")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        const rows: TurfRow[] =
          data?.map((row) => ({
            id: row.id as string,
            name: row.name as string,
            location: row.location as string,
            price_per_hour: Number(row.price_per_hour ?? 0),
            time_zone: row.time_zone as string
          })) ?? [];

        setTurfs(rows);
        setStatus(rows.length ? "Live arena list loaded from Supabase." : "No turfs found in database.");
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Failed to load turfs.";
        setStatus(message);
      }
    };

    void loadTurfs();
  }, []);

  const filters = useMemo(() => {
    const cities = Array.from(new Set(turfs.map((turf) => getCity(turf.location))));
    return ["All", ...cities];
  }, [turfs]);

  const filteredTurfs = useMemo(() => {
    if (activeFilter === "All") return turfs;
    return turfs.filter((turf) => getCity(turf.location) === activeFilter);
  }, [turfs, activeFilter]);

  const featuredTurfs = useMemo(() => turfs.slice(0, 4), [turfs]);

  return (
    <PageShell>
      <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
        <h1 className="text-3xl font-black">Discover Sports Arenas</h1>
        <p className="mt-2 text-sm text-zinc-400">Explore available sports venues from the live Postgres inventory.</p>
        <p className="mt-3 text-xs text-zinc-300">{status}</p>
      </section>

      <section className="mb-5 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = activeFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-neon bg-neon text-zinc-900"
                  : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {filter}
            </button>
          );
        })}
      </section>

      <section className="mb-6 overflow-x-auto">
        <div className="flex min-w-max gap-3">
          {featuredTurfs.map((turf) => (
            <article
              key={turf.id}
              className="w-64 rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-4"
            >
              <p className="text-xs uppercase tracking-wide text-cyan-300">Live Arena</p>
              <h3 className="mt-2 text-sm font-semibold text-zinc-100">{turf.name}</h3>
              <p className="mt-1 text-xs text-zinc-400">{turf.location}</p>
              <p className="mt-3 text-xs text-zinc-300">Rs. {turf.price_per_hour}/hour</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredTurfs.map((turf) => (
          <article key={turf.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <button
              type="button"
              onClick={() => setExpandedArenaId((current) => (current === turf.id ? null : turf.id))}
              className="w-full text-left"
            >
              <h3 className="text-base font-semibold">{turf.name}</h3>
              <p className="mt-1 text-sm text-zinc-400">{turf.location}</p>
              <p className="mt-2 text-sm text-zinc-300">Timezone: {turf.time_zone}</p>
              <p className="text-sm text-zinc-300">Price: Rs. {turf.price_per_hour}/hour</p>
              <p className="mt-2 text-xs font-semibold text-neon">
                {expandedArenaId === turf.id ? "Hide details" : "View details"}
              </p>
            </button>

            {expandedArenaId === turf.id ? (
              <div className="mt-3 rounded-xl border border-zinc-700 bg-zinc-800/70 p-3">
                <p className="text-sm text-zinc-300">{getArenaDescription(turf)}</p>
                <Link
                  href={`/bookings?turf_id=${encodeURIComponent(turf.id)}`}
                  className="mt-3 inline-block rounded-xl bg-neon px-4 py-2 text-xs font-bold text-zinc-900 hover:brightness-95"
                >
                  Book Now
                </Link>
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </PageShell>
  );
}
