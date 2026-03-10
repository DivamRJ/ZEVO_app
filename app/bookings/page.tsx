"use client";

import { useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AvailabilityCalendar } from "@/components/booking/availability-calendar";
import { BookingForm } from "@/components/booking/booking-form";
import { TurfCard } from "@/components/booking/turf-card";
import { PageShell } from "@/components/zevo/page-shell";
import { getTurfs, type BookingApi, type TurfApi } from "@/lib/api-client";

export default function BookingsPage() {
  const [turfs, setTurfs] = useState<TurfApi[]>([]);
  const [selectedTurf, setSelectedTurf] = useState<TurfApi | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start_time: string; end_time: string } | null>(null);
  const [status, setStatus] = useState("Loading turfs...");
  const [latestBooking, setLatestBooking] = useState<BookingApi | null>(null);

  useEffect(() => {
    const loadTurfs = async () => {
      try {
        const payload = await getTurfs();
        setTurfs(payload);

        if (payload.length > 0) {
          setSelectedTurf(payload[0]);
          setStatus("Select a slot and start the booking flow.");
        } else {
          setStatus("No turfs found from backend.");
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
      turf_id: selectedTurf.turf_id,
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
              key={turf.turf_id}
              turf={turf}
              selected={selectedTurf?.turf_id === turf.turf_id}
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
            turf_id={selectedTurf?.turf_id ?? null}
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
