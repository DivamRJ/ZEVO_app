"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

type GlassVariant = "subtle" | "medium" | "prominent";

type GlassCardProps = HTMLMotionProps<"div"> & {
  variant?: GlassVariant;
  glow?: boolean;
  children: React.ReactNode;
  className?: string;
};

const variantStyles: Record<GlassVariant, string> = {
  subtle: "glass-card",
  medium: "glass-card",
  prominent: "glass-panel",
};

export function GlassCard({
  variant = "medium",
  glow = false,
  children,
  className = "",
  ...motionProps
}: GlassCardProps) {
  const base = glow ? "glass-card-glow" : variantStyles[variant];

  return (
    <motion.div
      className={`${base} p-5 ${className}`}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      {...motionProps}
    >
      {glow && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl shimmer-overlay" />
      )}
      {children}
    </motion.div>
  );
}
