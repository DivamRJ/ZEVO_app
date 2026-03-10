 "use client";

import { useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AvailabilityCalendar } from "@/components/booking/availability-calendar";
import { BookingForm } from "@/components/booking/booking-form";
import { TurfCard } from "@/components/booking/turf-card";
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

export default function BookingsPage() {
  const [turfs, setTurfs] = useState<TurfRow[]>([]);
  const [selectedTurf, setSelectedTurf] = useState<TurfRow | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start_time: string; end_time: string } | null>(null);
  const [status, setStatus] = useState("Loading turfs...");
  const [latestBooking, setLatestBooking] = useState<BookingRow | null>(null);

  useEffect(() => {
    const loadTurfs = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("turfs")
          .select("id, owner_id, name, location, price_per_hour, time_zone")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        const rows: TurfRow[] =
          data?.map((row) => ({
            id: row.id as string,
            owner_id: row.owner_id as string,
            name: row.name as string,
            location: row.location as string,
            price_per_hour: Number(row.price_per_hour ?? 0),
            time_zone: row.time_zone as string
          })) ?? [];

        setTurfs(rows);

        if (rows.length > 0) {
          const requestedTurfId =
            typeof window !== "undefined"
              ? new URLSearchParams(window.location.search).get("turf_id")
              : null;
          const requestedTurf = requestedTurfId
            ? rows.find((item) => item.id === requestedTurfId) || null
            : null;

          setSelectedTurf(requestedTurf || rows[0]);
          setStatus("Select a slot and start the booking flow.");
        } else {
          setStatus("No turfs found in database.");
        }
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Failed to load turfs.";
        setStatus(message);
      }
    };

    void loadTurfs();
  }, []);

  const bookingPayloadPreview = useMemo(() => {
    if (!selectedTurf || !selectedSlot) return null;

    return {
      turf_id: selectedTurf.id,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time
    };
  }, [selectedTurf, selectedSlot]);

  return (
    <PageShell>
      <ProtectedRoute>
        <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h1 className="text-3xl font-black">My Bookings</h1>
          <p className="mt-2 text-sm text-zinc-400">
            End-to-end booking flow synced with backend lock/payment lifecycle.
          </p>
          <p className="mt-3 text-xs text-zinc-300">{status}</p>
        </section>

        <section className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <AvailabilityCalendar
            turf_id={selectedTurf?.id ?? null}
            selectedSlot={selectedSlot}
            onSelectSlot={(slot) => {
              setSelectedSlot(slot);
              setLatestBooking(null);
            }}
          />

          <BookingForm
            selectedTurf={selectedTurf}
            selectedSlot={selectedSlot}
            onBookingConfirmed={(booking) => setLatestBooking(booking)}
          />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <h2 className="text-lg font-semibold">API Payload Preview</h2>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950 p-3 text-xs text-zinc-300">
              {JSON.stringify(bookingPayloadPreview, null, 2)}
            </pre>
          </article>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <h2 className="text-lg font-semibold">Latest Confirmed Booking</h2>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950 p-3 text-xs text-zinc-300">
              {JSON.stringify(latestBooking, null, 2)}
            </pre>
          </article>
        </section>
      </ProtectedRoute>
    </PageShell>
  );
}
