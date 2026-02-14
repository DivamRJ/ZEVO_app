"use client";

import { useEffect, useState } from "react";

import { AuthPanel } from "@/components/zevo/auth-panel";
import { PageShell } from "@/components/zevo/page-shell";
import { SPORTS, type Sport } from "@/lib/zevo-data";
import { getProfile, saveProfile, type StoredProfile } from "@/lib/zevo-storage";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [skillLevel, setSkillLevel] = useState<StoredProfile["skillLevel"]>("Beginner");
  const [interests, setInterests] = useState<Sport[]>([]);
  const [saved, setSaved] = useState<StoredProfile | null>(null);
  const [status, setStatus] = useState("Create your ZEVO profile to unlock chat and group features.");

  useEffect(() => {
    const existing = getProfile();
    if (!existing) return;
    setSaved(existing);
    setName(existing.name);
    setCity(existing.city);
    setSkillLevel(existing.skillLevel);
    setInterests(existing.interests);
  }, []);

  const toggleInterest = (sport: Sport) => {
    setInterests((current) => (current.includes(sport) ? current.filter((s) => s !== sport) : [...current, sport]));
  };

  const onSave = () => {
    if (!name.trim()) {
      setStatus("Name is required.");
      return;
    }

    const now = new Date().toISOString();
    const next: StoredProfile = {
      name: name.trim(),
      city: city.trim(),
      skillLevel,
      interests,
      profileId: saved?.profileId ?? `zevo_${crypto.randomUUID()}`,
      createdAt: saved?.createdAt ?? now,
      updatedAt: now
    };

    saveProfile(next);
    setSaved(next);
    setStatus("Profile saved. Public Chat and Group are now available in navbar.");
  };

  return (
    <PageShell>
      <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
        <h1 className="text-3xl font-black">Profile</h1>
        <p className="mt-2 text-sm text-zinc-400">Sign up or log in, then set your player identity and interests.</p>
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
        <p className="mt-3 text-xs text-zinc-300">{status}</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-neon"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Your city"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-neon"
          />
          <select
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value as StoredProfile["skillLevel"])}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-neon"
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
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

          <button type="button" onClick={onSave} className="w-full rounded-xl bg-neon px-4 py-2 text-sm font-bold text-zinc-900">
            Save Profile
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="text-lg font-semibold">Saved Profile</h2>
          {saved ? (
            <div className="mt-3 space-y-1 text-sm text-zinc-300">
              <p>Name: {saved.name}</p>
              <p>City: {saved.city || "Not added"}</p>
              <p>Skill: {saved.skillLevel}</p>
              <p>Interests: {saved.interests.length ? saved.interests.join(", ") : "Not added"}</p>
              <p className="text-xs text-zinc-500">Updated: {new Date(saved.updatedAt).toLocaleString()}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-400">No profile saved yet.</p>
          )}
        </div>
      </section>
    </PageShell>
  );
}
