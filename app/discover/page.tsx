"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { PageShell } from "@/components/zevo/page-shell";
import { FILTERS, TURFS, type SportFilter } from "@/lib/zevo-data";

function getArenaDescription(params: {
  name: string;
  location: string;
  sport: string;
  price: string;
  format?: string;
}) {
  const sportLabel = params.format ?? params.sport;
  return `${params.name} is a well-rated ${sportLabel} sports arena in ${params.location}. This venue is great for local matches, team practice sessions, and weekend meetups with easy slot planning. Pricing starts at ${params.price}.`;
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DiscoverContent />
    </Suspense>
  );
}

function DiscoverContent() {
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<SportFilter>("All");
  const [expandedArenaId, setExpandedArenaId] = useState<string | null>(null);

  useEffect(() => {
    const sportFromQuery = searchParams.get("sport");
    if (!sportFromQuery) return;
    const isKnownFilter = FILTERS.includes(sportFromQuery as SportFilter);
    if (isKnownFilter) {
      setActiveFilter(sportFromQuery as SportFilter);
    }
  }, [searchParams]);

  const filteredTurfs = useMemo(() => {
    if (activeFilter === "All") return TURFS;
    return TURFS.filter((turf) => turf.sport === activeFilter);
  }, [activeFilter]);
  const featuredTurfs = useMemo(() => TURFS.slice(0, 4), []);

  return (
    <PageShell>
      <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
        <h1 className="text-3xl font-black">Discover Sports Arenas</h1>
        <p className="mt-2 text-sm text-zinc-400">Explore available sports venues across multiple locations.</p>
      </section>

      <section className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
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
            <article key={turf.id} className="w-64 rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-4">
              <p className="text-xs uppercase tracking-wide text-cyan-300">Trending Arena</p>
              <h3 className="mt-2 text-sm font-semibold text-zinc-100">{turf.name}</h3>
              <p className="mt-1 text-xs text-zinc-400">{turf.location}</p>
              <p className="mt-3 text-xs text-zinc-300">{turf.format ?? turf.sport}</p>
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
              <p className="mt-2 text-sm text-zinc-300">Sport: {turf.format ?? turf.sport}</p>
              <p className="text-sm text-zinc-300">Price: {turf.price}</p>
              <p className="mt-2 text-xs font-semibold text-neon">
                {expandedArenaId === turf.id ? "Hide details" : "View details"}
              </p>
            </button>

            {expandedArenaId === turf.id ? (
              <div className="mt-3 rounded-xl border border-zinc-700 bg-zinc-800/70 p-3">
                <p className="text-sm text-zinc-300">
                  {getArenaDescription({
                    name: turf.name,
                    location: turf.location,
                    sport: turf.sport,
                    price: turf.price,
                    format: turf.format
                  })}
                </p>
                <Link
                  href={`/bookings?arena=${encodeURIComponent(turf.name)}&sport=${encodeURIComponent(turf.format ?? turf.sport)}&location=${encodeURIComponent(turf.location)}&price=${encodeURIComponent(turf.price)}`}
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
