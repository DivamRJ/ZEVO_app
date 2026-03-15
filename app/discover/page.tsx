"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, MapPin, Navigation, Database, Loader2 } from "lucide-react";

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
  latitude: number | null;
  longitude: number | null;
  amenities: string[];
};

type Coords = { lat: number; lng: number };

function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function DiscoverPage() {
  const [turfs, setTurfs] = useState<TurfRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("Loading arenas…");
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");
  const { user, isAuthenticated } = useAuth();

  const [urlSport, setUrlSport] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setUrlSport(params.get("sport"));
    }
  }, []);

  const loadTurfs = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("turfs")
        .select("id, name, location, price_per_hour, time_zone, latitude, longitude, amenities")
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
          latitude: r.latitude != null ? Number(r.latitude) : null,
          longitude: r.longitude != null ? Number(r.longitude) : null,
          amenities: Array.isArray(r.amenities) ? r.amenities as string[] : [],
        })) ?? []
      );
      setStatus("Live arenas loaded.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed to load turfs.");
    }
  }, []);

  useEffect(() => { void loadTurfs(); }, [loadTurfs]);

  // Request user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => setUserCoords({ lat: coords.latitude, lng: coords.longitude }),
        () => {}, // silently fail
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    }
  }, []);

  // Seed arenas
  const seedArenas = async () => {
    setSeeding(true);
    setSeedMsg("");
    try {
      const res = await fetch("/api/seed-arenas", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Seed failed");
      setSeedMsg(json.message);
      // Reload turfs
      await loadTurfs();
    } catch (e) {
      setSeedMsg(e instanceof Error ? e.message : "Seed failed.");
    } finally {
      setSeeding(false);
    }
  };

  // Nearby arenas (sorted by distance from user)
  const nearbyTurfs = useMemo(() => {
    if (!userCoords) return [];
    return turfs
      .filter((t) => t.latitude != null && t.longitude != null)
      .map((t) => ({
        ...t,
        distance: haversineKm(userCoords, { lat: t.latitude!, lng: t.longitude! }),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6);
  }, [turfs, userCoords]);

  // Trending: sort by price descending
  const trendingTurfs = useMemo(
    () => [...turfs].sort((a, b) => b.price_per_hour - a.price_per_hour).slice(0, 8),
    [turfs]
  );

  // Fuzzy search filter
  const filteredTurfs = useMemo(() => {
    let list = turfs;
    if (urlSport) list = list.filter((t) => t.name.toLowerCase().includes(urlSport.toLowerCase()));
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((t) => t.name.toLowerCase().includes(q) || t.location.toLowerCase().includes(q));
  }, [turfs, searchQuery, urlSport]);

  // Personalized
  const personalizedTurfs = useMemo(() => {
    if (!isAuthenticated || !user?.interests?.length) return [];
    return turfs.filter((t) => user.interests.some((interest) => t.name.toLowerCase().includes(interest.toLowerCase())));
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
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="relative mb-8 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-neon/20 via-cyan-500/10 to-violet-600/15" />
        <div className="pointer-events-none absolute inset-0 shimmer-overlay rounded-3xl" />
        <div className="glass-panel relative border-0 px-6 py-10 sm:px-10 sm:py-14">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-neon">
            <Sparkles size={12} /> Discover
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="text-3xl font-black leading-tight sm:text-4xl xl:text-5xl">
            Find your perfect arena.
            <br />
            <span className="bg-gradient-to-r from-neon via-cyan-400 to-violet-400 bg-clip-text text-transparent">Play anywhere, anytime.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4 max-w-xl text-sm text-zinc-400">
            Explore {turfs.length} live arenas across your city. Filter by sport, compare prices, and lock your slot in seconds.
          </motion.p>

          {/* Search bar */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6 max-w-lg">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search arenas by name or location…" className="glass-input w-full py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500" />
            </div>
          </motion.div>

          {/* Seed button — only if no turfs */}
          {turfs.length === 0 && isAuthenticated && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-4">
              <button type="button" onClick={seedArenas} disabled={seeding} className="btn-primary flex items-center gap-2 text-xs">
                {seeding ? <><Loader2 size={14} className="animate-spin" /> Seeding…</> : <><Database size={14} /> Seed Sample Arenas</>}
              </button>
              {seedMsg && <p className="mt-2 text-xs text-zinc-400">{seedMsg}</p>}
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Nearby Arenas (geolocation-powered) */}
      {nearbyTurfs.length > 0 && (
        <section className="mb-8">
          <SectionHeader title="Near You" badge="📍 Live" subtitle="Sorted by distance from your location" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyTurfs.map((turf, i) => (
              <motion.div key={turf.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.06 }} whileHover={{ y: -4, scale: 1.01 }}>
                <Link href={`/bookings?turf_id=${encodeURIComponent(turf.id)}`} className="group relative block glass-card-glow overflow-hidden p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-zinc-100">{turf.name}</h3>
                      <p className="mt-1 text-xs text-zinc-400 truncate">{turf.location}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                        <Navigation size={9} /> {turf.distance.toFixed(1)} km
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-base font-bold text-zinc-200">₹{turf.price_per_hour}<span className="ml-1 text-xs font-normal text-zinc-500">/hr</span></p>
                    {turf.amenities.length > 0 && (
                      <div className="flex gap-1">
                        {turf.amenities.slice(0, 2).map((a) => (
                          <span key={a} className="rounded-full bg-zinc-800/60 px-1.5 py-0.5 text-[9px] text-zinc-400">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link href={`/map?arena=${turf.id}`} className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-neon opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <MapPin size={11} /> View on Map →
                  </Link>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      {trendingTurfs.length > 0 && (
        <section className="mb-8">
          <SectionHeader title="Trending Arenas" badge="Hot" subtitle="Most popular venues based on demand" />
          <TrendingCarousel turfs={trendingTurfs} />
        </section>
      )}

      {/* Personalized */}
      {personalizedTurfs.length > 0 && (
        <section className="mb-8">
          <SectionHeader title="For You" badge="Personalized" subtitle={`Based on your interests: ${user?.interests?.join(", ")}`} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {personalizedTurfs.map((turf, i) => (
              <motion.div key={turf.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.06 }} whileHover={{ y: -4, scale: 1.01 }}>
                <Link href={`/bookings?turf_id=${encodeURIComponent(turf.id)}`} className="block glass-card-glow p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">{turf.name}</h3>
                      <p className="mt-1 text-xs text-zinc-400">{turf.location}</p>
                    </div>
                    <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-violet-300">For You</span>
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
        <SectionHeader title={urlSport ? `${urlSport} Arenas` : "All Arenas"} badge={`${filteredTurfs.length}`} subtitle={searchQuery ? `Showing results for "${searchQuery}"` : "Complete live inventory"} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTurfs.map((turf, i) => (
            <motion.div key={turf.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.04 }} whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Link href={`/bookings?turf_id=${encodeURIComponent(turf.id)}`} className="group relative block glass-card overflow-hidden p-4">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-neon/5 via-transparent to-violet-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl" />
                <div className="relative">
                  <h3 className="text-sm font-bold text-zinc-100">{turf.name}</h3>
                  <p className="mt-1 text-xs text-zinc-400">{turf.location}</p>
                  {turf.amenities.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {turf.amenities.slice(0, 3).map((a) => (
                        <span key={a} className="rounded-full bg-zinc-800/60 px-1.5 py-0.5 text-[9px] text-zinc-400">{a}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-base font-bold text-zinc-200">₹{turf.price_per_hour}<span className="ml-1 text-xs font-normal text-zinc-500">/hr</span></p>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{turf.time_zone}</span>
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-neon opacity-0 transition-opacity duration-200 group-hover:opacity-100">Book Now →</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filteredTurfs.length === 0 && (
          <GlassCard className="mt-4">
            <div className="flex flex-col items-center gap-3 py-6">
              <MapPin size={24} className="text-zinc-500" />
              <p className="text-sm text-zinc-400">
                {searchQuery ? `No arenas match "${searchQuery}". Try a different search.` : "No arenas available."}
              </p>
              {isAuthenticated && turfs.length === 0 && (
                <button type="button" onClick={seedArenas} disabled={seeding} className="btn-primary flex items-center gap-2 text-xs">
                  {seeding ? <><Loader2 size={14} className="animate-spin" /> Seeding…</> : <><Database size={14} /> Seed Sample Arenas</>}
                </button>
              )}
              {seedMsg && <p className="text-xs text-zinc-400">{seedMsg}</p>}
            </div>
          </GlassCard>
        )}
      </section>
    </PageShell>
  );
}
