\"use client\";

import { useEffect, useMemo, useState } from \"react\";

import { createClient } from \"@/utils/supabase/client\";

type AvailabilityCalendarProps = {
  turf_id: string | null;
  onSelectSlot: (slot: { start_time: string; end_time: string }) => void;
  selectedSlot: { start_time: string; end_time: string } | null;
};

function getTodayDateInputValue() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function AvailabilityCalendar({ turf_id, onSelectSlot, selectedSlot }: AvailabilityCalendarProps) {
  const [date, setDate] = useState(getTodayDateInputValue);
  const [slots, setSlots] = useState<{ start_time: string; end_time: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!turf_id) {
      setSlots([]);
      return;
    }

    const loadAvailability = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const dayStart = new Date(date);
        const dayEnd = new Date(date);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

        const { data, error } = await supabase
          .from("bookings")
          .select("start_time, end_time, status, lock_expires_at")
          .eq("turf_id", turf_id)
          .gte("start_time", dayStart.toISOString())
          .lt("start_time", dayEnd.toISOString());

        if (error) {
          throw error;
        }

        const existing: { start_time: string; end_time: string }[] =
          data?.map((row) => ({
            start_time: row.start_time as string,
            end_time: row.end_time as string
          })) ?? [];

        const now = Date.now();
        const futureSlots = existing.filter((slot) => new Date(slot.start_time).getTime() > now);
        setSlots(futureSlots);
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Failed to fetch available slots.";
        setError(message);
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    void loadAvailability();
  }, [turf_id, date]);

  const selectedSlotKey = useMemo(() => {
    if (!selectedSlot) return "";
    return `${selectedSlot.start_time}_${selectedSlot.end_time}`;
  }, [selectedSlot]);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
      <h2 className="text-lg font-semibold">Availability Calendar</h2>
      <p className="mt-1 text-xs text-zinc-400">Live availability from `/available-slots`.</p>

      <div className="mt-3">
        <label className="mb-1 block text-xs text-zinc-400">Date</label>
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
        />
      </div>

      {!turf_id ? <p className="mt-3 text-sm text-zinc-400">Select a turf first.</p> : null}
      {loading ? <p className="mt-3 text-sm text-zinc-400">Loading slots...</p> : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot) => {
          const key = `${slot.start_time}_${slot.end_time}`;
          const active = selectedSlotKey === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectSlot({ start_time: slot.start_time, end_time: slot.end_time })}
              className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                active
                  ? "border-neon bg-neon/10 text-zinc-100"
                  : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              <p>{new Date(slot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              <p className="text-xs text-zinc-400">
                to {new Date(slot.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </button>
          );
        })}
      </div>

      {!loading && !error && turf_id && slots.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-400">No available 60-minute slots for this date.</p>
      ) : null}
    </section>
  );
}
