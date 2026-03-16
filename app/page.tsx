"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Compass, Map, User, MessageCircle, Users, HelpCircle, ArrowRight } from "lucide-react";

import { AuthPanel } from "@/components/zevo/auth-panel";
import { PageShell } from "@/components/zevo/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { useUser } from "@/hooks/use-user";
import { SPORT_COLLAGE } from "@/lib/zevo-data";

const facilities = [
  { title: "Discover Arenas", description: "Find nearby grounds and courts across every sport with fast filters.", href: "/discover", icon: <Compass size={18} /> },
  { title: "Live Arena Map", description: "Compare options by area and get instant route directions.", href: "/map", icon: <Map size={18} /> },
  { title: "Player Profile", description: "Set your interests and skill to unlock personalized recommendations.", href: "/profile", icon: <User size={18} /> },
  { title: "Public Chat", description: "Discuss slots, create meetup plans, and coordinate with players.", href: "/chat", icon: <MessageCircle size={18} /> },
  { title: "Community Group", description: "Connect with active players and coordinate games.", href: "/group", icon: <Users size={18} /> },
  { title: "Help Center", description: "Get support for bookings, profile setup, and guidance.", href: "/about", icon: <HelpCircle size={18} /> },
];

const sportContent: Record<string, string> = {
  Football: "5v5 and full-pitch options with peak-hour booking visibility.",
  Cricket: "Box cricket and net sessions for quick games or structured practice.",
  Badminton: "Indoor court availability with easy doubles/singles planning.",
  Volleyball: "Casual evening rallies and organized weekend group games.",
  Tennis: "Court discovery for solo drills, coaching, or competitive sets.",
  Basketball: "Urban courts and indoor arenas for pickup and squad runs.",
  Pickleball: "Fast-growing community courts with beginner-friendly access.",
  Futsal: "Small-sided fast gameplay venues for high-energy sessions.",
  "Table Tennis": "Compact indoor setups ideal for quick practice blocks.",
  Padel: "Social doubles-friendly courts built for modern club play.",
  Hockey: "Dedicated hockey arenas for local teams and structured drills.",
  Skating: "Open skate spots and arenas for freestyle and training sessions.",
};

export default function IntroPage() {
  const { loading, isAuthenticated } = useUser();
  const router = useRouter();

  return (
    <PageShell>
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-10 overflow-hidden rounded-3xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-neon/20 via-cyan-500/10 to-violet-600/15" />
        <div className="pointer-events-none absolute inset-0 shimmer-overlay rounded-3xl" />
        <div className="glass-panel relative border-0 p-6 sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-3 inline-flex rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-neon">
                ZEVO Platform
              </motion.p>
              <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="text-4xl font-black leading-tight sm:text-5xl xl:text-6xl">
                Your full local sports ecosystem,{" "}
                <span className="bg-gradient-to-r from-neon via-cyan-400 to-violet-400 bg-clip-text text-transparent">in one place.</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4 max-w-xl text-sm text-zinc-400 sm:text-base">
                Discover where to play, who to play with, and when to lock your next session.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6 flex flex-wrap gap-3">
                <Link href="/discover" className="btn-primary flex items-center gap-2">
                  Start Exploring <ArrowRight size={14} />
                </Link>
                <Link href="/profile" className="btn-secondary">Create Profile</Link>
              </motion.div>
            </div>

            {/* Sport grid */}
            <div className="grid grid-cols-2 gap-3">
              {SPORT_COLLAGE.slice(0, 8).map((item, index) => (
                <motion.div
                  key={item.sport}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.2 + index * 0.06 }}
                  whileHover={{ y: -4, scale: 1.03 }}
                  onClick={() => router.push(`/discover?sport=${encodeURIComponent(item.sport)}`)}
                  className={`cursor-pointer rounded-2xl border border-zinc-800/50 bg-gradient-to-br p-4 transition-all duration-300 hover:border-zinc-600/50 ${item.tone}`}
                >
                  <p className="text-2xl">{item.icon}</p>
                  <p className="mt-3 text-sm font-semibold">{item.sport}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Auth panel — only when logged out */}
      {!loading && !isAuthenticated && (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-10">
          <AuthPanel title="Get Started" subtitle="Create your account or log in to access all features." />
        </motion.section>
      )}

      {/* Features */}
      <SectionHeader title="What ZEVO Provides" subtitle="Everything you need for your sports life" />
      <div className="mb-10 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {facilities.map((facility, index) => (
          <motion.div
            key={facility.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link href={facility.href} className="group relative block glass-card overflow-hidden p-5">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-neon/5 via-transparent to-violet-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl" />
              <div className="relative">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-neon/15 text-neon">{facility.icon}</div>
                <h3 className="text-base font-bold">{facility.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{facility.description}</p>
                <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-neon opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  Open <ArrowRight size={12} />
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Sports on ZEVO */}
      <SectionHeader title="Sports On ZEVO" subtitle="Browse all available sports and jump into the one that matches your pace" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SPORT_COLLAGE.map((item, index) => (
          <motion.article
            key={item.sport}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.32, delay: index * 0.04 }}
            whileHover={{ y: -5, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/discover?sport=${encodeURIComponent(item.sport)}`)}
            className="group relative cursor-pointer overflow-hidden glass-card p-5"
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-20 transition-opacity duration-300 group-hover:opacity-40 ${item.tone}`} />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-3 py-2 text-2xl">{item.icon}</div>
                <span className="rounded-full border border-zinc-700/50 bg-zinc-900/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-400">ZEVO</span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{item.sport}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {sportContent[item.sport] ?? "Explore venues and community activities."}
              </p>
              <div className="mt-4 h-px w-full bg-zinc-800/50" />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-zinc-500 transition group-hover:text-zinc-300">Tap to explore</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); router.push(`/bookings?sport=${encodeURIComponent(item.sport)}`); }}
                  className="btn-primary px-3 py-1 text-[10px]"
                >
                  Book
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </PageShell>
  );
}
