"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AvailabilityCalendar } from "@/components/booking/availability-calendar";
import { BookingForm } from "@/components/booking/booking-form";
import { TurfCard } from "@/components/booking/turf-card";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageShell } from "@/components/zevo/page-shell";
import { createClient } from "@/utils/supabase/client";

export type BookingRow = {
  id: string;
  user_id: string;
  turf_id: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  lock_expires_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
};

export type TurfRow = {
  id: string;
  name: string;
  owner_id: string;
  location: string;
  time_zone: string;
  price_per_hour: number;
};

type StatCardProps = {
  label: string;
  count: number;
  color: string;
  icon: string;
  delay: number;
};

function StatCard({ label, count, color, icon, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card-glow relative overflow-hidden p-4"
    >
      <div className="pointer-events-none absolute -right-3 -top-3 text-4xl opacity-15">{icon}</div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-1 text-3xl font-black ${color}`}>{count}</p>
    </motion.div>
  );
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export default function BookingsPage() {
  const [turfs, setTurfs] = useState<TurfRow[]>([]);
  const [selectedTurf, setSelectedTurf] = useState<TurfRow | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start_time: string; end_time: string } | null>(null);
  const [status, setStatus] = useState("Loading turfs…");
  const [latestBooking, setLatestBooking] = useState<BookingRow | null>(null);
  const [reservations, setReservations] = useState<BookingRow[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(true);

  // Load turfs
  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("turfs")
          .select("id, owner_id, name, location, price_per_hour, time_zone")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const rows: TurfRow[] = data?.map((r) => ({
          id: r.id as string, owner_id: r.owner_id as string, name: r.name as string,
          location: r.location as string, price_per_hour: Number(r.price_per_hour ?? 0),
          time_zone: r.time_zone as string,
        })) ?? [];

        setTurfs(rows);

        if (rows.length > 0) {
          const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
          const requested = params?.get("turf_id");
          const match = requested ? rows.find((t) => t.id === requested) : null;
          setSelectedTurf(match || rows[0]);
          setStatus("Select a slot and start the booking flow.");
        } else {
          setStatus("No turfs found in database.");
        }
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Failed to load turfs.");
      }
    };
    void load();
  }, []);

  // Load user's reservation history
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingReservations(true);
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.user) {
          setLoadingReservations(false);
          return;
        }

        const { data, error } = await supabase
          .from("bookings")
          .select("id, user_id, turf_id, start_time, end_time, total_price, status, lock_expires_at, confirmed_at, completed_at, cancelled_at")
          .eq("user_id", sessionData.session.user.id)
          .order("start_time", { ascending: false })
          .limit(20);

        if (error) throw error;

        setReservations(
          (data ?? []).map((r) => ({
            id: r.id as string, user_id: r.user_id as string, turf_id: r.turf_id as string,
            start_time: r.start_time as string, end_time: r.end_time as string,
            total_price: Number(r.total_price ?? 0), status: r.status as BookingRow["status"],
            lock_expires_at: r.lock_expires_at as string | null,
            confirmed_at: r.confirmed_at as string | null,
            completed_at: r.completed_at as string | null,
            cancelled_at: r.cancelled_at as string | null,
          }))
        );
      } catch { /* ignore */ }
      finally { setLoadingReservations(false); }
    };
    void load();
  }, [latestBooking]);

  const stats = useMemo(() => {
    const counts = { PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 };
    reservations.forEach((r) => { if (counts[r.status] !== undefined) counts[r.status]++; });
    return counts;
  }, [reservations]);

  const turfNameMap = useMemo(() => {
    const map = new Map<string, string>();
    turfs.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [turfs]);

  return (
    <PageShell>
      <ProtectedRoute>
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-panel mb-6 p-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-neon" />
            <div>
              <h1 className="text-3xl font-black">My Bookings</h1>
              <p className="mt-1 text-sm text-zinc-400">{status}</p>
            </div>
          </div>
        </motion.section>

        {/* Reservation Status Dashboard */}
        <SectionHeader title="Reservation Dashboard" badge="Live" />
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Pending" count={stats.PENDING} color="text-amber-300" icon="⏳" delay={0} />
          <StatCard label="Confirmed" count={stats.CONFIRMED} color="text-emerald-400" icon="✅" delay={0.08} />
          <StatCard label="Completed" count={stats.COMPLETED} color="text-cyan-400" icon="🏆" delay={0.16} />
          <StatCard label="Cancelled" count={stats.CANCELLED} color="text-red-400" icon="✕" delay={0.24} />
        </div>

        {/* Turf selection */}
        <SectionHeader title="Select Arena" subtitle="Pick an arena to view availability and start booking" />
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          {turfs.map((turf) => (
            <TurfCard
              key={turf.id}
              turf={turf}
              selected={selectedTurf?.id === turf.id}
              onSelect={(next) => {
                setSelectedTurf(next);
                setSelectedSlot(null);
                setLatestBooking(null);
              }}
            />
          ))}
        </motion.section>

        {/* Calendar + Form */}
        <section className="mb-6 grid gap-6 lg:grid-cols-2">
          <AvailabilityCalendar
            turf_id={selectedTurf?.id ?? null}
            selectedSlot={selectedSlot}
            onSelectSlot={(slot) => { setSelectedSlot(slot); setLatestBooking(null); }}
          />
          <BookingForm
            selectedTurf={selectedTurf}
            selectedSlot={selectedSlot}
            onBookingConfirmed={(booking) => setLatestBooking(booking)}
          />
        </section>

        {/* Reservation History */}
        <SectionHeader title="My Reservations" subtitle="Your recent booking history" />
        <div className="grid gap-3 md:grid-cols-2">
          {loadingReservations && (
            <GlassCard className="col-span-full">
              <p className="text-sm text-zinc-400">Loading reservations…</p>
            </GlassCard>
          )}
          {!loadingReservations && reservations.length === 0 && (
            <GlassCard className="col-span-full">
              <p className="text-sm text-zinc-400">No reservations yet. Book your first slot above!</p>
            </GlassCard>
          )}
          {reservations.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="glass-card p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">
                    {turfNameMap.get(r.turf_id) || r.turf_id.slice(0, 8)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {new Date(r.start_time).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    {" · "}
                    {new Date(r.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" → "}
                    {new Date(r.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-zinc-500">ID: {r.id.slice(0, 12)}…</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-zinc-200">₹{r.total_price}</p>
                  {(r.status === "PENDING" || r.status === "CONFIRMED") && (
                    <button
                      type="button"
                      onClick={async () => {
                        const supabase = createClient();
                        const { error } = await supabase
                          .from("bookings")
                          .update({ status: "CANCELLED" })
                          .eq("id", r.id);
                        if (!error) {
                          setReservations((prev) =>
                            prev.map((b) => b.id === r.id ? { ...b, status: "CANCELLED" } : b)
                          );
                        }
                      }}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400 transition hover:bg-red-500/20"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ProtectedRoute>
    </PageShell>
  );
}
