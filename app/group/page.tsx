"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Calendar, MessageSquare } from "lucide-react";

import { PageShell } from "@/components/zevo/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { useUser } from "@/hooks/use-user";

export default function GroupPage() {
  const { user, loading, isAuthenticated } = useUser();

  if (loading) {
    return (
      <PageShell>
        <div className="glass-panel p-8">
          <h1 className="text-3xl font-black">Group</h1>
          <p className="mt-2 text-sm text-zinc-400">Checking your session…</p>
        </div>
      </PageShell>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <PageShell>
        <div className="glass-panel p-8">
          <h1 className="text-3xl font-black">Group</h1>
          <p className="mt-2 text-sm text-zinc-400">Login and complete your profile to unlock community group access.</p>
          <Link href="/profile" className="btn-primary mt-4 inline-block">Go To Profile</Link>
        </div>
      </PageShell>
    );
  }

  const topics = [
    { text: "Saturday 6:00 AM: Football 5v5 squad", icon: "⚽" },
    { text: "Sunday 7:30 AM: Cricket practice nets", icon: "🏏" },
    { text: "Weekday 8:00 PM: Badminton doubles ladder", icon: "🏸" },
  ];

  return (
    <PageShell>
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-panel mb-6 p-6"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-neon/15 p-2"><Users size={18} className="text-neon" /></div>
          <div>
            <h1 className="text-2xl font-black">Community Group</h1>
            <p className="mt-1 text-xs text-zinc-400">Your profile drives group visibility and match suggestions.</p>
          </div>
        </div>
      </motion.section>

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Community Pulse", value: "Live", icon: <Users size={14} className="text-emerald-400" /> },
          { label: "Open Topics", value: "3 active threads", icon: <MessageSquare size={14} className="text-cyan-400" /> },
          { label: "Next Meetup", value: "Saturday 6:00 AM", icon: <Calendar size={14} className="text-amber-300" /> },
        ].map((item, i) => (
          <motion.article
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="stat-card"
          >
            <div className="flex items-center gap-2 mb-1">
              {item.icon}
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{item.label}</p>
            </div>
            <p className="text-sm font-bold text-zinc-100">{item.value}</p>
          </motion.article>
        ))}
      </div>

      {/* Profile + Topics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
          <SectionHeader title="Your Profile" />
          <div className="mt-3 space-y-2 text-sm text-zinc-300">
            <p className="font-medium text-zinc-100">{user.name}</p>
            <p>{user.city || "City not set"}</p>
            <p>{user.skillLevel}</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {user.interests.length ? user.interests.map((i) => (
                <span key={i} className="rounded-full border border-neon/30 bg-neon/10 px-2 py-0.5 text-[10px] font-semibold text-neon">{i}</span>
              )) : <span className="text-zinc-500">No interests set</span>}
            </div>
          </div>
        </motion.article>

        <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <SectionHeader title="Quick Group Topics" />
          <ul className="mt-3 space-y-2">
            {topics.map((topic) => (
              <li key={topic.text} className="flex items-center gap-2 rounded-xl bg-zinc-800/40 p-3 text-sm text-zinc-300 transition-all duration-300 hover:bg-zinc-800/60">
                <span className="text-lg">{topic.icon}</span>
                {topic.text}
              </li>
            ))}
          </ul>
          <Link href="/chat" className="btn-primary mt-4 inline-block text-xs">Open Public Chat</Link>
        </motion.article>
      </div>
    </PageShell>
  );
}
