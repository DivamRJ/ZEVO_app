"use client";

import { motion } from "framer-motion";
import { CircleDot, Volleyball, Goal, Trophy, type LucideIcon } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  timeLabel: string;
  venueName: string;
  sportType: string;
  filledSlots: number;
  maxSlots: number;
}

const sportIconMap: Record<string, LucideIcon> = {
  football: Goal,
  cricket: Trophy,
  badminton: CircleDot,
  volleyball: Volleyball
};

export function MatchCard({ timeLabel, venueName, sportType, filledSlots, maxSlots }: MatchCardProps) {
  const fillPct = Math.round((filledSlots / maxSlots) * 100);
  const nearlyFull = fillPct >= 80;
  const Icon = sportIconMap[sportType.toLowerCase()] ?? Trophy;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-zinc-800/80 bg-zinc-900/65 p-4 shadow-glass backdrop-blur-xl"
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">{timeLabel}</p>
          <h3 className="mt-1 text-lg font-bold text-zinc-100">{venueName}</h3>
        </div>
        <div className="rounded-xl border border-[#8b5cf6]/40 bg-[#8b5cf6]/15 p-2 text-[#c4b5fd]">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">Slots</span>
          <span className={cn("font-semibold text-zinc-200", nearlyFull && "text-red-400")}>{filledSlots}/{maxSlots} filled</span>
        </div>
        <Progress value={fillPct} indicatorClassName={cn(nearlyFull ? "bg-red-500" : "bg-[#d9f99d]")} />
      </div>
    </motion.article>
  );
}
