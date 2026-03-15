"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

type TrendingTurf = {
  id: string;
  name: string;
  location: string;
  price_per_hour: number;
};

type TrendingCarouselProps = {
  turfs: TrendingTurf[];
};

export function TrendingCarousel({ turfs }: TrendingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || turfs.length < 3) return;

    let raf: number;
    let speed = 0.5;
    let paused = false;

    const animate = () => {
      if (!paused && el) {
        el.scrollLeft += speed;
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
          el.scrollLeft = 0;
        }
      }
      raf = requestAnimationFrame(animate);
    };

    const pause = () => { paused = true; };
    const resume = () => { paused = false; };

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause);
    el.addEventListener("touchend", resume);

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
    };
  }, [turfs.length]);

  // Drag-to-scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft ?? 0));
    setScrollLeft(scrollRef.current?.scrollLeft ?? 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current.offsetLeft ?? 0);
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => setIsDragging(false);

  if (turfs.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
      style={{ cursor: isDragging ? "grabbing" : "grab", scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {turfs.map((turf, i) => (
        <motion.div
          key={turf.id}
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: i * 0.06 }}
          className="group relative min-w-[260px] max-w-[280px] flex-shrink-0"
        >
          <Link
            href={`/bookings?turf_id=${encodeURIComponent(turf.id)}`}
            className="block glass-card-glow overflow-hidden p-4"
            onClick={(e) => { if (isDragging) e.preventDefault(); }}
          >
            {/* Trending badge */}
            <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              <span className="animate-pulse">🔥</span> Trending
            </span>

            {/* Gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl" />

            <h3 className="mt-2 text-sm font-bold text-zinc-100">{turf.name}</h3>
            <p className="mt-1 text-xs text-zinc-400">{turf.location}</p>
            <p className="mt-2 text-base font-bold text-zinc-200">
              ₹{turf.price_per_hour}<span className="ml-1 text-xs font-normal text-zinc-500">/hr</span>
            </p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
