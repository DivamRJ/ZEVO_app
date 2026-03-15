"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mt-12 glass-panel p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-zinc-100">ZEVO</p>
          <p className="mt-1 text-xs text-zinc-500">
            © {currentYear} ZEVO. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { label: "Terms", href: "/about" },
            { label: "Privacy", href: "/about" },
            { label: "Support", href: "/about" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-zinc-400 transition-all duration-300 hover:bg-zinc-800/50 hover:text-zinc-200"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </motion.footer>
  );
}
