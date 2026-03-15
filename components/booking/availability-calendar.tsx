"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { createClient } from "@/utils/supabase/client";

type AvailabilityCalendarProps = {
  turf_id: string | null;
  onSelectSlot: (slot: { start_time: string; end_time: string }) => void;
  selectedSlot: { start_time: string; end_time: string } | null;
};

function getMonthData(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const totalDays = lastDay.getDate();
  return { startDow, totalDays, firstDay };
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function AvailabilityCalendar({ turf_id, onSelectSlot, selectedSlot }: AvailabilityCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(today));
  const [slots, setSlots] = useState<{ start_time: string; end_time: string }[]>([]);
  const [slotDays, setSlotDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startDow, totalDays } = getMonthData(viewYear, viewMonth);

  // Fetch all bookings for the month to find which days have slots
  useEffect(() => {
    if (!turf_id) {
      setSlotDays(new Set());
      return;
    }

    const loadMonthSlots = async () => {
      try {
        const supabase = createClient();
        const monthStart = new Date(viewYear, viewMonth, 1);
        const monthEnd = new Date(viewYear, viewMonth + 1, 1);

        const { data, error } = await supabase
          .from("bookings")
          .select("start_time")
          .eq("turf_id", turf_id)
          .gte("start_time", monthStart.toISOString())
          .lt("start_time", monthEnd.toISOString());

        if (error) return;

        const days = new Set<string>();
        data?.forEach((row) => {
          const d = new Date(row.start_time as string);
          days.add(toDateKey(d));
        });
        setSlotDays(days);
      } catch {
        // Silently fail — dots just won't show
      }
    };

    void loadMonthSlots();
  }, [turf_id, viewYear, viewMonth]);

  // Fetch slots for selected date
  useEffect(() => {
    if (!turf_id || !selectedDate) {
      setSlots([]);
      return;
    }

    const loadSlots = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const dayStart = new Date(selectedDate);
        const dayEnd = new Date(selectedDate);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

        const { data, error } = await supabase
          .from("bookings")
          .select("start_time, end_time, status, lock_expires_at")
          .eq("turf_id", turf_id)
          .gte("start_time", dayStart.toISOString())
          .lt("start_time", dayEnd.toISOString());

        if (error) throw error;

        const existing = data?.map((row) => ({
          start_time: row.start_time as string,
          end_time: row.end_time as string,
        })) ?? [];

        const now = Date.now();
        setSlots(existing.filter((s) => new Date(s.start_time).getTime() > now));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch slots.");
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    void loadSlots();
  }, [turf_id, selectedDate]);

  const selectedSlotKey = useMemo(() => {
    if (!selectedSlot) return "";
    return `${selectedSlot.start_time}_${selectedSlot.end_time}`;
  }, [selectedSlot]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const todayKey = toDateKey(today);

  return (
    <section className="glass-panel p-5">
      <h2 className="text-lg font-semibold">Availability Calendar</h2>
      <p className="mt-1 text-xs text-zinc-400">Select a date, then pick a slot</p>

      {/* Month navigation */}
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrevMonth}
          className="rounded-lg border border-zinc-700 bg-zinc-800/70 p-1.5 text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-semibold text-zinc-200">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </p>
        <button
          type="button"
          onClick={goNextMonth}
          className="rounded-lg border border-zinc-700 bg-zinc-800/70 p-1.5 text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mt-3 grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="mt-1 grid grid-cols-7 gap-0.5">
        {/* Empty cells for offset */}
        {Array.from({ length: startDow }).map((_, i) => (
          <div key={`empty-${i}`} className="h-9" />
        ))}

        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDate;
          const hasSlots = slotDays.has(dateKey);

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => setSelectedDate(dateKey)}
              className={`relative flex h-9 items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 ${
                isSelected
                  ? "bg-neon text-zinc-900 font-bold shadow-neon-glow"
                  : isToday
                  ? "border border-neon/30 bg-neon/10 text-neon"
                  : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
              }`}
            >
              {day}
              {hasSlots && !isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-neon" />
              )}
            </button>
          );
        })}
      </div>

      {/* Expanded slots for selected date */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-4 overflow-hidden"
          >
            <p className="mb-2 text-xs font-medium text-zinc-400">
              Slots for {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </p>

            {!turf_id && <p className="text-sm text-zinc-500">Select a turf first.</p>}
            {loading && <p className="text-sm text-zinc-500">Loading slots…</p>}
            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {slots.map((slot) => {
                const key = `${slot.start_time}_${slot.end_time}`;
                const active = selectedSlotKey === key;

                return (
                  <motion.button
                    key={key}
                    type="button"
                    onClick={() => onSelectSlot(slot)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition-all duration-200 ${
                      active
                        ? "border-neon bg-neon/15 text-zinc-100 shadow-neon-glow"
                        : "border-zinc-700/60 bg-zinc-800/50 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    <p className="font-medium">
                      {new Date(slot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-xs text-zinc-400">
                      to {new Date(slot.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            {!loading && !error && turf_id && slots.length === 0 && (
              <p className="text-sm text-zinc-500">No available slots for this date.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
