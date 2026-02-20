"use client";

import React from "react";

import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { cn } from "@/lib/utils";

type BackgroundRippleEffectDemoProps = {
  children: React.ReactNode;
  className?: string;
};

export function BackgroundRippleEffectDemo({ children, className }: BackgroundRippleEffectDemoProps) {
  return (
    <div className={cn("relative flex w-full flex-col items-start justify-start overflow-hidden rounded-3xl", className)}>
      <BackgroundRippleEffect />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
