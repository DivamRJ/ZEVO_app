"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Wallet, User } from "lucide-react";

import { AuthPanel } from "@/components/zevo/auth-panel";
import { Progress } from "@/components/ui/progress";
import { PageShell } from "@/components/zevo/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { useAuth } from "@/context/auth-context";
import { createClient } from "@/utils/supabase/client";
import { SPORTS } from "@/lib/zevo-data";

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function ProfilePage() {
  const { user, loading, setCurrentUser } = useAuth();

  const [city, setCity] = useState("");
  const [skillLevel, setSkillLevel] = useState("Beginner");
  const [interests, setInterests] = useState<string[]>([]);
  const [status, setStatus] = useState("Create your ZEVO profile to unlock chat and group features.");
  const [submitting, setSubmitting] = useState(false);
  const [addingFunds, setAddingFunds] = useState(false);

  useEffect(() => {
    if (!user) return;
    setCity(user.city || "");
    setSkillLevel(user.skillLevel || "Beginner");
    setInterests(Array.isArray(user.interests) ? user.interests : []);
  }, [user]);

  const profileCompletion = useMemo(() => {
    if (!user) return 0;
    return Math.min(100, (user.name.trim() ? 30 : 0) + (city.trim() ? 20 : 0) + (skillLevel ? 20 : 0) + (interests.length > 0 ? 30 : 0));
  }, [user, city, skillLevel, interests]);

  const toggleInterest = (sport: string) => {
    setInterests((current) => current.includes(sport) ? current.filter((value) => value !== sport) : [...current, sport]);
  };

  const onSave = async () => {
    if (!user) { setStatus("Please login first."); return; }
    try {
      setSubmitting(true);
      const supabase = createClient();
      const { data, error } = await supabase.from("profiles").update({ city: city.trim(), skill_level: skillLevel, interests }).eq("id", user.id).select("id, email, display_name, role, wallet_balance, city, skill_level, interests").single();
      if (error) throw error;
      setCurrentUser({ id: data.id, email: data.email, name: data.display_name, role: data.role, walletBalance: Number(data.wallet_balance ?? 0), city: data.city, skillLevel: data.skill_level, interests: Array.isArray(data.interests) ? data.interests : [] });
      setStatus("Profile saved to Supabase.");
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : "Failed to save profile.");
    } finally { setSubmitting(false); }
  };

  const onAddFunds = async () => {
    if (!user) { setStatus("Please login first."); return; }
    try {
      setAddingFunds(true);
      const supabase = createClient();
      const { data, error } = await supabase.from("profiles").update({ wallet_balance: (user.walletBalance ?? 0) + 500 }).eq("id", user.id).select("id, email, display_name, role, wallet_balance, city, skill_level, interests").single();
      if (error) throw error;
      setCurrentUser({ id: data.id, email: data.email, name: data.display_name, role: data.role, walletBalance: Number(data.wallet_balance ?? 0), city: data.city, skillLevel: data.skill_level, interests: Array.isArray(data.interests) ? data.interests : [] });
      setStatus("Added ₹500 to wallet.");
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : "Failed to add wallet funds.");
    } finally { setAddingFunds(false); }
  };

  return (
    <PageShell>
      {/* Header */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="glass-panel mb-6 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-neon/15 p-2"><User size={18} className="text-neon" /></div>
          <div>
            <h1 className="text-2xl font-black">Profile</h1>
            <p className="mt-1 text-xs text-zinc-400">Sign up or log in, then set your player identity and interests.</p>
          </div>
        </div>

        {/* Completion bar */}
        <div className="mt-5 rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-300">
            <span>Profile Completion</span>
            <span className="font-bold">{profileCompletion}%</span>
          </div>
          <Progress value={profileCompletion} indicatorClassName="bg-gradient-to-r from-neon via-cyan-400 to-violet-400" />
          <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
            {["Identity", "Skill Tag", "Interest Graph"].map((label) => (
              <span key={label} className="rounded-full border border-zinc-700/50 bg-zinc-800/50 px-2 py-0.5 text-zinc-400">{label}</span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Auth */}
      <section className="mb-6">
        <AuthPanel title="Sign Up / Login" subtitle="Account access now lives inside Profile." />
      </section>

      {/* Player profile form */}
      <SectionHeader title="Player Profile" subtitle="Set your interests and level for personalized discovery" />
      <p className="mb-4 text-xs text-zinc-400">{loading ? "Checking session…" : status}</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card space-y-4 p-5">
          <input value={user?.name || ""} readOnly placeholder="Your name" className="input-field opacity-60" />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" className="input-field" />
          <select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} className="input-field">
            {SKILL_LEVELS.map((level) => (<option key={level} value={level}>{level}</option>))}
          </select>

          <div className="flex flex-wrap gap-2">
            {SPORTS.map((sport) => {
              const active = interests.includes(sport);
              return (
                <button
                  key={sport}
                  type="button"
                  onClick={() => toggleInterest(sport)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-300 ${
                    active ? "border-neon bg-neon text-zinc-900 shadow-[0_0_8px_rgba(204,255,0,0.2)]" : "border-zinc-700 bg-zinc-800/70 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {sport}
                </button>
              );
            })}
          </div>

          <button type="button" onClick={onSave} disabled={submitting || !user} className="btn-primary w-full">
            {submitting ? "Saving…" : "Save Profile"}
          </button>
        </motion.div>

        {/* Account Snapshot */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
          <SectionHeader title="Account Snapshot" />
          {user ? (
            <div className="mt-3 space-y-3">
              <div className="space-y-1 text-sm text-zinc-300">
                <p><span className="text-zinc-500">Name:</span> {user.name}</p>
                <p><span className="text-zinc-500">Email:</span> {user.email}</p>
                <p><span className="text-zinc-500">City:</span> {user.city || "Not added"}</p>
                <p><span className="text-zinc-500">Skill:</span> {user.skillLevel}</p>
                <p><span className="text-zinc-500">Interests:</span> {user.interests.length ? user.interests.join(", ") : "Not added"}</p>
              </div>

              <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-4">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-neon" />
                  <span className="text-lg font-bold text-zinc-100">₹{user.walletBalance}</span>
                </div>
                <button type="button" onClick={onAddFunds} disabled={addingFunds} className="btn-secondary mt-3 w-full text-xs">
                  {addingFunds ? "Adding…" : "Add Funds (₹500)"}
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-400">Login to view and update profile.</p>
          )}
        </motion.div>
      </div>
    </PageShell>
  );
}
