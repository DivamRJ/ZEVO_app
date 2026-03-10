"use client";

import { useEffect, useMemo, useState } from "react";

import { AuthPanel } from "@/components/zevo/auth-panel";
import { Progress } from "@/components/ui/progress";
import { PageShell } from "@/components/zevo/page-shell";
import { useAuth } from "@/context/auth-context";
import { addWalletFunds, updateUserProfile } from "@/lib/api-client";
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

    return Math.min(
      100,
      (user.name.trim() ? 30 : 0) +
        (city.trim() ? 20 : 0) +
        (skillLevel ? 20 : 0) +
        (interests.length > 0 ? 30 : 0)
    );
  }, [user, city, skillLevel, interests]);

  const toggleInterest = (sport: string) => {
    setInterests((current) =>
      current.includes(sport) ? current.filter((value) => value !== sport) : [...current, sport]
    );
  };

  const onSave = async () => {
    if (!user) {
      setStatus("Please login first.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = await updateUserProfile({
        city: city.trim(),
        skillLevel,
        interests
      });
      setCurrentUser(payload.user);
      setStatus("Profile saved to backend.");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to save profile.";
      setStatus(message);
    } finally {
      setSubmitting(false);
    }
  };

  const onAddFunds = async () => {
    if (!user) {
      setStatus("Please login first.");
      return;
    }

    try {
      setAddingFunds(true);
      const payload = await addWalletFunds(500);
      setCurrentUser(payload.user);
      setStatus("Added Rs. 500 to wallet.");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to add wallet funds.";
      setStatus(message);
    } finally {
      setAddingFunds(false);
    }
  };

  return (
    <PageShell>
      <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
        <h1 className="text-3xl font-black">Profile</h1>
        <p className="mt-2 text-sm text-zinc-400">Sign up or log in, then set your player identity and interests.</p>
        <div className="mt-4 rounded-2xl border border-zinc-700 bg-zinc-800/70 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-300">
            <span>Profile Completion</span>
            <span>{profileCompletion}%</span>
          </div>
          <Progress value={profileCompletion} indicatorClassName="bg-gradient-to-r from-cyan-400 to-violet-400" />
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-zinc-600 px-2 py-1 text-zinc-300">Identity</span>
            <span className="rounded-full border border-zinc-600 px-2 py-1 text-zinc-300">Skill Tag</span>
            <span className="rounded-full border border-zinc-600 px-2 py-1 text-zinc-300">Interest Graph</span>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <AuthPanel
          title="Sign Up / Login"
          subtitle="Account access now lives inside Profile. No separate auth page is needed."
        />
      </section>

      <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
        <h2 className="text-2xl font-black">Create Your Player Profile</h2>
        <p className="mt-2 text-sm text-zinc-400">Set your interests and level for personalized arena discovery and group matching.</p>
        <p className="mt-3 text-xs text-zinc-300">{loading ? "Checking session..." : status}</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <input
            value={user?.name || ""}
            readOnly
            placeholder="Your name"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 opacity-70 outline-none"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Your city"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-neon"
          />
          <select
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-neon"
          >
            {SKILL_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-2">
            {SPORTS.map((sport) => {
              const active = interests.includes(sport);
              return (
                <button
                  key={sport}
                  type="button"
                  onClick={() => toggleInterest(sport)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    active
                      ? "border-neon bg-neon text-zinc-900"
                      : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {sport}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onSave}
            disabled={submitting || !user}
            className="w-full rounded-xl bg-neon px-4 py-2 text-sm font-bold text-zinc-900 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save Profile"}
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="text-lg font-semibold">Account Snapshot</h2>
          {user ? (
            <div className="mt-3 space-y-1 text-sm text-zinc-300">
              <p>Name: {user.name}</p>
              <p>Email: {user.email}</p>
              <p>City: {user.city || "Not added"}</p>
              <p>Skill: {user.skillLevel}</p>
              <p>Interests: {user.interests.length ? user.interests.join(", ") : "Not added"}</p>
              <p className="pt-2 text-base font-semibold text-zinc-100">Wallet Balance: Rs. {user.walletBalance}</p>
              <button
                type="button"
                onClick={onAddFunds}
                disabled={addingFunds}
                className="mt-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-500 disabled:opacity-60"
              >
                {addingFunds ? "Adding..." : "Add Funds (Rs. 500)"}
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-400">Login to view and update profile.</p>
          )}
        </div>
      </section>
    </PageShell>
  );
}
