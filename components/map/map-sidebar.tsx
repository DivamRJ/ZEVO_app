"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, X, Route, Loader2 } from "lucide-react";
import Link from "next/link";

type MapSidebarProps = {
  turf: {
    id: string;
    name: string;
    location: string;
    price_per_hour: number;
    time_zone: string;
  } | null;
  routeInfo: { distance: string; duration: string } | null;
  loadingRoute: boolean;
  onClose: () => void;
  onGetDirections: () => void;
};

export function MapSidebar({ turf, routeInfo, loadingRoute, onClose, onGetDirections }: MapSidebarProps) {
  return (
    <AnimatePresence>
      {turf && (
        <motion.aside
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute right-0 top-0 z-[1000] flex h-full w-80 flex-col glass-panel rounded-l-2xl rounded-r-none border-l border-t-0 border-r-0 border-b-0 p-5"
        >
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="mb-4 self-end rounded-lg border border-zinc-700/50 bg-zinc-800/70 p-1.5 text-zinc-400 transition-all duration-300 hover:text-zinc-100 hover:bg-zinc-700/70"
          >
            <X size={16} />
          </button>

          {/* Turf info */}
          <div className="flex-1">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-neon/15 p-2.5">
                <MapPin size={18} className="text-neon" />
              </div>
              <h3 className="text-base font-bold text-zinc-100">{turf.name}</h3>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Location</p>
                <p className="mt-1 text-sm text-zinc-200">{turf.location}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Price</p>
                  <p className="mt-1 text-lg font-bold text-zinc-100">₹{turf.price_per_hour}<span className="text-xs font-normal text-zinc-500">/hr</span></p>
                </div>
                <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Timezone</p>
                  <p className="mt-1 text-sm font-medium text-zinc-200">{turf.time_zone}</p>
                </div>
              </div>

              {/* Route info */}
              {routeInfo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Route size={14} className="text-cyan-400" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">Route</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-cyan-300">{routeInfo.distance}</span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-sm text-zinc-300">~{routeInfo.duration}</span>
                  </div>
                </motion.div>
              )}

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Availability</p>
                <p className="mt-1 text-sm text-zinc-300">Check the booking page for real-time slot data.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 space-y-2">
            <Link
              href={`/bookings?turf_id=${encodeURIComponent(turf.id)}`}
              className="btn-primary flex w-full items-center justify-center gap-2"
            >
              Book Now
            </Link>
            <button
              type="button"
              onClick={onGetDirections}
              disabled={loadingRoute}
              className="btn-secondary flex w-full items-center justify-center gap-2"
            >
              {loadingRoute ? (
                <><Loader2 size={14} className="animate-spin" /> Calculating…</>
              ) : (
                <><Navigation size={14} /> {routeInfo ? "Recalculate Route" : "Get Directions"}</>
              )}
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
