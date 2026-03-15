"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";

import { PageShell } from "@/components/zevo/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { GlassCard } from "@/components/ui/glass-card";
import { TrendingCarousel } from "@/components/discover/trending-carousel";
import { CollectionCard } from "@/components/discover/collection-card";
import { SPORT_COLLAGE } from "@/lib/zevo-data";
import { useAuth } from "@/context/auth-context";
import { createClient } from "@/utils/supabase/client";

type TurfRow = {
  id: string;
  name: string;
  location: string;
  price_per_hour: number;
  time_zone: string;
};

function getCity(location: string) {
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] || "Unknown";
}

export default function DiscoverPage() {
  const [turfs, setTurfs] = useState<TurfRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("Loading arenas…");
  const { user, isAuthenticated } = useAuth();

  // Check URL for sport filter
  const [urlSport, setUrlSport] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setUrlSport(params.get("sport"));
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("turfs")
          .select("id, name, location, price_per_hour, time_zone")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setTurfs(
          data?.map((r) => ({
            id: r.id as string,
            name: r.name as string,
            location: r.location as string,
            price_per_hour: Number(r.price_per_hour ?? 0),
            time_zone: r.time_zone as string,
          })) ?? []
        );
        setStatus("Live arenas loaded.");
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Failed to load turfs.");
      }
    };
    void load();
  }, []);

  // Trending: sort by price descending as popularity heuristic
  const trendingTurfs = useMemo(
    () => [...turfs].sort((a, b) => b.price_per_hour - a.price_per_hour).slice(0, 8),
    [turfs]
  );

  // Fuzzy search filter
  const filteredTurfs = useMemo(() => {
    let list = turfs;
    if (urlSport) {
      list = list.filter((t) => t.name.toLowerCase().includes(urlSport.toLowerCase()));
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (t) => t.name.toLowerCase().includes(q) || t.location.toLowerCase().includes(q)
    );
  }, [turfs, searchQuery, urlSport]);

  // Personalized: match user interests to turf names
  const personalizedTurfs = useMemo(() => {
    if (!isAuthenticated || !user?.interests?.length) return [];
    return turfs.filter((t) =>
      user.interests.some((interest) => t.name.toLowerCase().includes(interest.toLowerCase()))
    );
  }, [turfs, user, isAuthenticated]);

  // Sport collections with counts
  const collections = useMemo(() => {
    return SPORT_COLLAGE.map((s) => ({
      ...s,
      count: turfs.filter((t) => t.name.toLowerCase().includes(s.sport.toLowerCase())).length,
    }));
  }, [turfs]);

  return (
    <PageShell>
      {/* Hero banner */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8 overflow-hidden rounded-3xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-neon/20 via-cyan-500/10 to-violet-600/15" />
        <div className="pointer-events-none absolute inset-0 shimmer-overlay rounded-3xl" />
        <div className="glass-panel relative border-0 px-6 py-10 sm:px-10 sm:py-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-neon"
          >
            <Sparkles size={12} /> Discover
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl font-black leading-tight sm:text-4xl xl:text-5xl"
          >
            Find your perfect arena.
            <br />
            <span className="bg-gradient-to-r from-neon via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Play anywhere, anytime.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 max-w-xl text-sm text-zinc-400"
          >
            Explore {turfs.length} live arenas across your city. Filter by sport, compare prices, and lock your slot in seconds.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 max-w-lg"
          >
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search arenas by name or location…"
                className="glass-input w-full py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500"
              />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Trending */}
      {trendingTurfs.length > 0 && (
        <section className="mb-8">
          <SectionHeader title="Trending Arenas" badge="Hot" subtitle="Most popular venues based on demand" />
          <TrendingCarousel turfs={trendingTurfs} />
        </section>
      )}

      {/* Personalized recommendations */}
      {personalizedTurfs.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            title="For You"
            badge="Personalized"
            subtitle={`Based on your interests: ${user?.interests?.join(", ")}`}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {personalizedTurfs.map((turf, i) => (
              <motion.div
                key={turf.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <Link
                  href={`/bookings?turf_id=${encodeURIComponent(turf.id)}`}
                  className="block glass-card-glow p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">{turf.name}</h3>
                      <p className="mt-1 text-xs text-zinc-400">{turf.location}</p>
                    </div>
                    <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-violet-300">
                      For You
                    </span>
                  </div>
                  <p className="mt-2 text-base font-bold text-zinc-200">₹{turf.price_per_hour}<span className="ml-1 text-xs font-normal text-zinc-500">/hr</span></p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Sport Collections */}
      <section className="mb-8">
        <SectionHeader title="Collections" subtitle="Browse arenas by sport" />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {collections.map((col) => (
            <CollectionCard key={col.sport} sport={col.sport} icon={col.icon} tone={col.tone} count={col.count} />
          ))}
        </div>
      </section>

      {/* All arenas */}
      <section>
        <SectionHeader
          title={urlSport ? `${urlSport} Arenas` : "All Arenas"}
          badge={`${filteredTurfs.length}`}
          subtitle={searchQuery ? `Showing results for "${searchQuery}"` : "Complete live inventory"}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTurfs.map((turf, i) => (
            <motion.div
              key={turf.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={`/bookings?turf_id=${encodeURIComponent(turf.id)}`}
                className="group relative block glass-card overflow-hidden p-4"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-neon/5 via-transparent to-violet-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl" />
                <div className="relative">
                  <h3 className="text-sm font-bold text-zinc-100">{turf.name}</h3>
                  <p className="mt-1 text-xs text-zinc-400">{turf.location}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-base font-bold text-zinc-200">
                      ₹{turf.price_per_hour}<span className="ml-1 text-xs font-normal text-zinc-500">/hr</span>
                    </p>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{turf.time_zone}</span>
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-neon opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    Book Now →
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filteredTurfs.length === 0 && (
          <GlassCard className="mt-4">
            <p className="text-sm text-zinc-400">
              {searchQuery ? `No arenas match "${searchQuery}". Try a different search.` : "No arenas available."}
            </p>
          </GlassCard>
        )}
      </section>
    </PageShell>
  );
}
