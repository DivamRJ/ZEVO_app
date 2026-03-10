"use client";

import Link from "next/link";

import { PageShell } from "@/components/zevo/page-shell";
import { useUser } from "@/hooks/use-user";

export default function GroupPage() {
  const { user, loading, isAuthenticated } = useUser();

  if (loading) {
    return (
      <PageShell>
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h1 className="text-3xl font-black">Group</h1>
          <p className="mt-2 text-sm text-zinc-400">Checking your session...</p>
        </section>
      </PageShell>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <PageShell>
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h1 className="text-3xl font-black">Group</h1>
          <p className="mt-2 text-sm text-zinc-400">Login and complete your profile to unlock community group access.</p>
          <Link href="/profile" className="mt-4 inline-block rounded-xl bg-neon px-4 py-2 text-sm font-bold text-zinc-900">
            Go To Profile
          </Link>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
        <h1 className="text-3xl font-black">Community Group</h1>
        <p className="mt-2 text-sm text-zinc-400">Your profile now syncs from backend and drives group visibility.</p>
      </section>

      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Community Pulse", value: "Live" },
          { label: "Open Topics", value: "3 active threads" },
          { label: "Next Meetup", value: "Saturday 6:00 AM" }
        ].map((item) => (
          <article key={item.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-400">{item.label}</p>
            <p className="mt-2 text-sm font-semibold text-zinc-100">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="font-semibold">Your Profile</h2>
          <div className="mt-3 space-y-1 text-sm text-zinc-300">
            <p>{user.name}</p>
            <p>{user.city || "City not set"}</p>
            <p>{user.skillLevel}</p>
            <p>{user.interests.length ? user.interests.join(", ") : "No interests set"}</p>
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="font-semibold">Quick Group Topics</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            <li>Saturday 6:00 AM: Football 5v5 squad</li>
            <li>Sunday 7:30 AM: Cricket practice nets</li>
            <li>Weekday 8:00 PM: Badminton doubles ladder</li>
          </ul>
          <Link href="/chat" className="mt-4 inline-block rounded-xl bg-neon px-4 py-2 text-xs font-bold text-zinc-900">
            Open Public Chat
          </Link>
        </article>
      </section>
    </PageShell>
  );
}
