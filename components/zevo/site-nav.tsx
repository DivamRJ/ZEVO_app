"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

import { useAuth } from "@/context/auth-context";

const baseLinks = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/bookings", label: "Bookings" },
  { href: "/chat", label: "Chat" },
  { href: "/map", label: "Map" },
  { href: "/profile", label: "Profile" },
  { href: "/about", label: "About" },
];

export function SiteNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const hasProfile = useMemo(() => {
    if (!user) return false;
    return Boolean(user.city || user.interests.length > 0 || user.skillLevel);
  }, [user]);

  const withGroup = hasProfile ? [...baseLinks, { href: "/group", label: "Group" }] : baseLinks;
  const links =
    user?.role === "OWNER" || user?.role === "ADMIN"
      ? [...withGroup, { href: "/owner-dashboard", label: "Dashboard" }]
      : withGroup;

  return (
    <motion.header
      initial={false}
      animate={{ y: scrolled ? 0 : 2 }}
      className={`sticky top-3 z-50 mb-8 rounded-2xl border px-4 py-3 backdrop-blur-2xl transition-all duration-500 sm:px-6 ${
        scrolled
          ? "border-zinc-600/30 bg-zinc-900/80 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          : "border-zinc-800/50 bg-zinc-900/60"
      }`}
    >
      {/* Gradient shimmer on scroll */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: scrolled ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-neon/5 via-cyan-400/5 to-violet-500/5"
      />

      <div className="relative flex items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-tight text-neon transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(204,255,0,0.4)]">
          ZEVO
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-wrap gap-1.5 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-300 ${
                  active
                    ? "bg-neon text-zinc-900 shadow-[0_2px_12px_rgba(204,255,0,0.25)]"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* User avatar */}
          {user && (
            <Link
              href="/profile"
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-neon/50 bg-neon/10 text-[11px] font-black text-neon transition-all duration-300 hover:border-neon hover:shadow-[0_0_8px_rgba(204,255,0,0.3)]"
              title={user.name || "Profile"}
            >
              {user.name?.charAt(0)?.toUpperCase() || "Z"}
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-zinc-400 transition-all duration-300 hover:bg-zinc-800/60 hover:text-zinc-100 md:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="mt-3 flex flex-col gap-1 overflow-hidden md:hidden"
          >
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ${
                    active
                      ? "bg-neon text-zinc-900"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
