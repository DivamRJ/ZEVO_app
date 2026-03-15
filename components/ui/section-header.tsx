"use client";

import { motion } from "framer-motion";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  className?: string;
};

export function SectionHeader({
  title,
  subtitle,
  badge,
  className = "",
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className={`mb-5 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-neon" />
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {badge && (
          <span className="rounded-full border border-neon/30 bg-neon/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-neon">
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-2 ml-4 max-w-2xl text-sm text-zinc-400">{subtitle}</p>
      )}
    </motion.div>
  );
}
