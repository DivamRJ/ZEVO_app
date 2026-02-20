"use client";

import { cn } from "@/lib/utils";

type BackgroundRippleEffectProps = {
  className?: string;
};

export function BackgroundRippleEffect({ className }: BackgroundRippleEffectProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute left-1/2 top-1/2 h-[14rem] w-[14rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/25 animate-ping [animation-duration:4s]" />
      <div className="absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/20 animate-ping [animation-duration:5.5s]" />
      <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/15 animate-ping [animation-duration:7s]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950/55 to-transparent" />
    </div>
  );
}
