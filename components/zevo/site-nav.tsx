"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { getProfile } from "@/lib/zevo-storage";

const baseLinks = [
  { href: "/", label: "Intro" },
  { href: "/discover", label: "Discover" },
  { href: "/bookings", label: "Bookings" },
  { href: "/chat", label: "Public Chat" },
  { href: "/map", label: "Map" },
  { href: "/profile", label: "Profile" },
  { href: "/about", label: "About" }
];

export function SiteNav() {
  const pathname = usePathname();
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const refresh = () => setHasProfile(Boolean(getProfile()));
    refresh();

    window.addEventListener("storage", refresh);
    window.addEventListener("zevo-profile-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("zevo-profile-updated", refresh);
    };
  }, []);

  const links = hasProfile ? [...baseLinks, { href: "/group", label: "Group" }] : baseLinks;

  return (
    <header className="sticky top-3 z-50 mb-8 rounded-2xl border border-zinc-800/70 bg-zinc-900/80 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-3xl font-black tracking-tight text-neon">
          ZEVO
        </Link>

        <nav className="flex flex-wrap gap-2 text-xs sm:text-sm">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <motion.div
                key={link.href}
                whileHover={{ y: -2, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 280, damping: 18 }}
              >
                <Link
                  href={link.href}
                  className={`block rounded-lg border px-3 py-2 transition ${
                    active
                      ? "border-neon bg-neon text-zinc-900"
                      : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-500"
                  }`}
                >
                  {link.label}
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
