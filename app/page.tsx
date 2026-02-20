"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { AuthPanel } from "@/components/zevo/auth-panel";
import { PageShell } from "@/components/zevo/page-shell";
import { SparklesPreview } from "@/components/zevo/sparkles-preview";
import { BackgroundRippleEffectDemo } from "@/components/ui/background-ripple-effect-demo";
import { useUser } from "@/hooks/use-user";
import { SPORT_COLLAGE } from "@/lib/zevo-data";

const facilities = [
  {
    title: "Discover Sports Arenas",
    description: "Find nearby grounds and courts across every sport with fast filters.",
    href: "/discover"
  },
  {
    title: "Live Arena Map",
    description: "Open map mode, compare options by area, and get instant directions.",
    href: "/map"
  },
  {
    title: "Player Profile",
    description: "Set your interests and skill to unlock personalized recommendations.",
    href: "/profile"
  },
  {
    title: "Public Chat & Meetup",
    description: "Post timings, discuss slots, and create meetup plans with venue + time.",
    href: "/chat"
  },
  {
    title: "Community Group",
    description: "Connect with active players and coordinate games with your local circle.",
    href: "/group"
  },
  {
    title: "Help Center",
    description: "Get support for bookings, profile setup, and feature guidance.",
    href: "/about"
  }
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
  Skating: "Open skate spots and arenas for freestyle and training sessions."
};

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 }
};

const sportsGrid = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 }
  }
};

const sportsCard = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32 } },
  hover: { y: -5, scale: 1.01, transition: { type: "spring", stiffness: 260, damping: 20 } }
};

const sportsBorderGlow = {
  hidden: { opacity: 0 },
  show: { opacity: 0 },
  hover: {
    opacity: 1,
    borderColor: ["rgba(56,189,248,0.9)", "rgba(168,85,247,0.9)", "rgba(56,189,248,0.9)"],
    boxShadow: [
      "0 0 0 rgba(56,189,248,0)",
      "0 0 18px rgba(56,189,248,0.45), 0 0 24px rgba(168,85,247,0.35)",
      "0 0 18px rgba(56,189,248,0.45), 0 0 24px rgba(168,85,247,0.35)"
    ],
    transition: { duration: 1.8, repeat: Infinity, ease: "linear" }
  }
};

export default function IntroPage() {
  const { loading, isAuthenticated } = useUser();
  const router = useRouter();
  const openSportDetails = (sport: string) => {
    router.push(`/discover?sport=${encodeURIComponent(sport)}`);
  };
  const openSportBooking = (sport: string) => {
    router.push(`/bookings?sport=${encodeURIComponent(sport)}`);
  };

  return (
    <PageShell fullWidth>
      <SparklesPreview />

      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
        transition={{ duration: 0.5 }}
        className="relative mb-10 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/75 px-4 py-6 sm:px-8 sm:py-10 lg:px-12"
      >
        <BackgroundRippleEffectDemo>
          <div className="pointer-events-none absolute -left-8 top-0 h-44 w-44 rounded-full bg-neon/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-8 bottom-0 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative grid gap-10 px-2 sm:px-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="pr-1 sm:pr-4">
              <p className="mb-3 inline-flex rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-neon">
                ZEVO Intro
              </p>
              <h1 className="text-4xl font-black leading-tight sm:text-5xl xl:text-6xl">
                Your full local sports ecosystem, in one place.
              </h1>
              <p className="mt-4 max-w-xl text-sm text-zinc-300 sm:text-base">
                ZEVO helps you discover where to play, who to play with, and when to lock your next session.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/profile" className="rounded-xl bg-neon px-4 py-2 text-sm font-bold text-zinc-900 hover:brightness-95">
                  Create Profile
                </Link>
                <Link href="/discover" className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-500">
                  Start Exploring
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {SPORT_COLLAGE.slice(0, 8).map((item, index) => (
                <motion.div
                  key={item.sport}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.07 }}
                  className={`rounded-2xl border border-zinc-800 bg-gradient-to-br p-4 ${item.tone}`}
                >
                  <p className="text-2xl">{item.icon}</p>
                  <p className="mt-3 text-sm font-semibold">{item.sport}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </BackgroundRippleEffectDemo>
      </motion.section>

      {!loading && !isAuthenticated ? (
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          transition={{ duration: 0.45 }}
          className="mb-10"
        >
          <AuthPanel
            title="New To ZEVO? Start Here"
            subtitle="Create your account or log in from the homepage before you explore arenas, bookings, and chat."
          />
        </motion.section>
      ) : null}

      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
        transition={{ duration: 0.45 }}
        className="mb-10"
      >
        <h2 className="mb-4 text-2xl font-bold">What ZEVO Provides</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {facilities.map((facility, index) => (
            <motion.div
              key={facility.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={facility.href}
                className="block rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 transition hover:border-neon/70"
              >
                <h3 className="text-lg font-semibold">{facility.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{facility.description}</p>
                <motion.p
                  className="mt-4 text-xs font-semibold text-neon"
                  initial={{ x: 0 }}
                  whileHover={{ x: 4 }}
                >
                  Open {facility.title}
                </motion.p>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
        transition={{ duration: 0.45 }}
        className="mb-6"
      >
        <h2 className="mb-4 text-2xl font-bold">Sports On ZEVO</h2>
        <p className="mb-4 max-w-3xl text-sm text-zinc-400">
          Every sport on ZEVO has its own community energy. Browse all available sports and jump into the one that matches your pace.
        </p>

        <motion.div
          variants={sportsGrid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {SPORT_COLLAGE.map((item, index) => (
            <motion.article
              key={item.sport}
              variants={sportsCard}
              onClick={() => openSportDetails(item.sport)}
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-25 transition-opacity duration-300 group-hover:opacity-45 ${item.tone}`} />

              <motion.div
                variants={sportsBorderGlow}
                className="pointer-events-none absolute inset-0 rounded-2xl border border-transparent"
              />

              <div className="relative flex items-start justify-between">
                <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/55 px-3 py-2 text-2xl leading-none text-zinc-100">
                  {item.icon}
                </div>
                <span className="rounded-full border border-zinc-700 bg-zinc-900/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  ZEVO Sport
                </span>
              </div>

              <h3 className="mt-4 text-lg font-semibold tracking-tight text-zinc-100">{item.sport}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {sportContent[item.sport] ?? "Explore venues and community activities for this sport."}
              </p>

              <div className="mt-4 h-px w-full bg-zinc-800" />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-zinc-500 transition group-hover:text-zinc-300">
                  Tap card to view details
                </p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openSportBooking(item.sport);
                  }}
                  className="rounded-lg bg-neon px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-900 hover:brightness-95"
                >
                  Book
                </button>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>

    </PageShell>
  );
}
