"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

type SparklesCoreProps = {
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  particleColor?: string;
};

type Particle = {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
};

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export function SparklesCore({
  className,
  background = "transparent",
  minSize = 0.4,
  maxSize = 1,
  particleDensity = 1200,
  particleColor = "#FFFFFF"
}: SparklesCoreProps) {
  const particleCount = Math.min(180, Math.max(50, Math.floor(particleDensity / 10)));

  const particles = useMemo<Particle[]>(() => {
    const rand = seededRandom(42);
    return Array.from({ length: particleCount }, () => {
      const size = minSize + rand() * (maxSize - minSize);
      return {
        left: rand() * 100,
        top: rand() * 100,
        size,
        delay: rand() * 4,
        duration: 2.4 + rand() * 3.2,
        opacity: 0.35 + rand() * 0.65
      };
    });
  }, [particleCount, minSize, maxSize]);

  return (
    <div className={cn("relative", className)} style={{ background }}>
      {particles.map((particle, index) => (
        <span
          key={`sparkle-${index}`}
          className="absolute rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size * 4}px`,
            height: `${particle.size * 4}px`,
            backgroundColor: particleColor,
            opacity: particle.opacity,
            filter: "blur(0.2px)",
            animation: `zevo-sparkle ${particle.duration}s ease-in-out ${particle.delay}s infinite`
          }}
        />
      ))}
      <style jsx>{`
        @keyframes zevo-sparkle {
          0% {
            transform: scale(0.7);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
          100% {
            transform: scale(0.7);
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
}
