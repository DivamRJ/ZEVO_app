"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, UserCheck, Filter, MapPin, Trophy, Star } from "lucide-react";

import { PageShell } from "@/components/zevo/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/utils/supabase/client";

type PublicProfile = {
  user_id: string;
  username: string;
  city: string | null;
  skill_level: string;
  interests: string[];
  rep_score: number;
};

export default function GroupPage() {
  const { user, loading, isAuthenticated } = useUser();
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterSkill, setFilterSkill] = useState<string>("all");
  const [filterSport, setFilterSport] = useState<string>("all");

  // Load public profiles from Supabase
  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("public_profiles")
          .select("user_id, username, city, skill_level, interests, rep_score")
          .order("rep_score", { ascending: false })
          .limit(100);

        if (error) throw error;
        setProfiles(
          (data ?? []).map((p) => ({
            user_id: p.user_id as string,
            username: p.username as string,
            city: p.city as string | null,
            skill_level: p.skill_level as string,
            interests: Array.isArray(p.interests) ? (p.interests as string[]) : [],
            rep_score: Number(p.rep_score ?? 0),
          }))
        );
      } catch {
        setProfiles([]);
      } finally {
        setLoadingProfiles(false);
      }
    };
    void load();
  }, []);

  // Derive filter options
  const cities = useMemo(() => {
    const set = new Set(profiles.map((p) => p.city).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [profiles]);

  const allSports = useMemo(() => {
    const set = new Set(profiles.flatMap((p) => p.interests));
    return Array.from(set).sort();
  }, [profiles]);

  // Filter logic
  const filteredProfiles = useMemo(() => {
    return profiles
      .filter((p) => p.user_id !== user?.id) // Exclude self
      .filter((p) => filterCity === "all" || p.city === filterCity)
      .filter((p) => filterSkill === "all" || p.skill_level === filterSkill)
      .filter((p) => filterSport === "all" || p.interests.includes(filterSport));
  }, [profiles, user?.id, filterCity, filterSkill, filterSport]);

  // Matched players — share at least one interest with current user
  const matchedPlayers = useMemo(() => {
    if (!user?.interests?.length) return [];
    return profiles
      .filter((p) => p.user_id !== user.id)
      .filter((p) => p.interests.some((i) => user.interests.includes(i)))
      .sort((a, b) => {
        // Score by overlapping interests
        const aScore = a.interests.filter((i) => user.interests.includes(i)).length;
        const bScore = b.interests.filter((i) => user.interests.includes(i)).length;
        return bScore - aScore;
      })
      .slice(0, 8);
  }, [profiles, user]);

  if (loading) {
    return (
      <PageShell>
        <div className="glass-panel p-8">
          <h1 className="text-3xl font-black">Community Group</h1>
          <p className="mt-2 text-sm text-zinc-400">Checking your session…</p>
        </div>
      </PageShell>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <PageShell>
        <div className="glass-panel p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-neon/15 p-2"><Users size={20} className="text-neon" /></div>
            <div>
              <h1 className="text-2xl font-black">Community Group</h1>
              <p className="text-xs text-zinc-400">Login and complete your profile to unlock community features.</p>
            </div>
          </div>
          <Link href="/profile" className="btn-primary inline-block">Go To Profile</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Header */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="glass-panel mb-6 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-neon/15 p-2"><Users size={20} className="text-neon" /></div>
          <div>
            <h1 className="text-2xl font-black">Community Group</h1>
            <p className="mt-1 text-xs text-zinc-400">Find players near you, match by interests and skill level.</p>
          </div>
        </div>
      </motion.section>

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total Players", value: profiles.length, icon: <Users size={14} className="text-emerald-400" /> },
          { label: "Your Matches", value: matchedPlayers.length, icon: <UserCheck size={14} className="text-neon" /> },
          { label: "Your Interests", value: user.interests.length, icon: <Star size={14} className="text-amber-300" /> },
        ].map((item, i) => (
          <motion.article key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              {item.icon}
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{item.label}</p>
            </div>
            <p className="text-lg font-bold text-zinc-100">{item.value}</p>
          </motion.article>
        ))}
      </div>

      {/* Matched Players */}
      {matchedPlayers.length > 0 && (
        <section className="mb-6">
          <SectionHeader title="Matched Players" badge="⚡ Live" subtitle="Players who share your sports interests" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {matchedPlayers.map((p, i) => {
              const shared = p.interests.filter((interest) => user.interests.includes(interest));
              return (
                <motion.article key={p.user_id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="glass-card-glow p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon/15 text-sm font-black text-neon">
                      {p.username?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-100 truncate">{p.username}</p>
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        {p.city && <><MapPin size={10} /> {p.city}</>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded-full border border-zinc-700/50 bg-zinc-800/50 px-2 py-0.5 text-[10px] text-zinc-300">
                      {p.skill_level}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <Trophy size={10} /> {p.rep_score}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {shared.map((s) => (
                      <span key={s} className="rounded-full border border-neon/30 bg-neon/10 px-1.5 py-0.5 text-[9px] font-semibold text-neon">{s}</span>
                    ))}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>
      )}

      {/* Filters */}
      <SectionHeader title="All Players" badge={`${filteredProfiles.length}`} subtitle="Browse and filter the full community" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter size={14} className="text-zinc-500" />
        <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="input-field w-auto py-1.5 text-xs">
          <option value="all">All Cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterSkill} onChange={(e) => setFilterSkill(e.target.value)} className="input-field w-auto py-1.5 text-xs">
          <option value="all">All Levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
        <select value={filterSport} onChange={(e) => setFilterSport(e.target.value)} className="input-field w-auto py-1.5 text-xs">
          <option value="all">All Sports</option>
          {allSports.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Player list */}
      {loadingProfiles ? (
        <div className="glass-card p-6 text-center"><p className="text-sm text-zinc-400">Loading players…</p></div>
      ) : filteredProfiles.length === 0 ? (
        <div className="glass-card p-6 text-center"><p className="text-sm text-zinc-400">No players match your filters.</p></div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProfiles.map((p, i) => (
            <motion.article key={p.user_id} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }} className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-black text-zinc-300">
                  {p.username?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-100 truncate">{p.username}</p>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    {p.city && <span className="flex items-center gap-1"><MapPin size={10} /> {p.city}</span>}
                    <span>{p.skill_level}</span>
                    <span className="flex items-center gap-1"><Trophy size={10} /> {p.rep_score}</span>
                  </div>
                </div>
              </div>
              {p.interests.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.interests.slice(0, 4).map((s) => (
                    <span key={s} className={`rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${
                      user.interests.includes(s) ? "border-neon/30 bg-neon/10 text-neon" : "border-zinc-700/50 bg-zinc-800/40 text-zinc-400"
                    }`}>{s}</span>
                  ))}
                  {p.interests.length > 4 && <span className="text-[9px] text-zinc-500">+{p.interests.length - 4}</span>}
                </div>
              )}
            </motion.article>
          ))}
        </div>
      )}

      {/* Quick link */}
      <div className="mt-6 text-center">
        <Link href="/chat" className="btn-primary inline-flex items-center gap-2 text-xs">
          Open Public Chat
        </Link>
      </div>
    </PageShell>
  );
}
