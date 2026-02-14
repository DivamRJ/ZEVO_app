"use client";

import { Suspense } from "react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PageShell } from "@/components/zevo/page-shell";
import { TURFS } from "@/lib/zevo-data";

function BookingContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState("Complete your details to continue booking.");
  const [selectedArenaId, setSelectedArenaId] = useState<string>(() => {
    const arenaFromQuery = params.get("arena");
    if (!arenaFromQuery) return TURFS[0].id;
    const matched = TURFS.find((arena) => arena.name.toLowerCase() === arenaFromQuery.toLowerCase());
    return matched?.id ?? TURFS[0].id;
  });

  const selectedArena = useMemo(
    () => TURFS.find((arena) => arena.id === selectedArenaId) ?? TURFS[0],
    [selectedArenaId]
  );

  const bookingInfo = useMemo(() => {
    return {
      arena: selectedArena.name,
      sport: selectedArena.format ?? selectedArena.sport,
      location: selectedArena.location,
      price: selectedArena.price
    };
  }, [selectedArena]);

  const confirmBooking = () => {
    setStatus("Booking request submitted. Arena host will confirm your slot shortly.");
  };

  return (
    <PageShell>
      <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
        <h1 className="text-3xl font-black">Bookings</h1>
        <p className="mt-2 text-sm text-zinc-400">Review arena details and proceed to confirm your booking.</p>
        <div className="mt-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-400">Select Arena</label>
          <select
            value={selectedArenaId}
            onChange={(event) => setSelectedArenaId(event.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-neon"
          >
            {TURFS.map((arena) => (
              <option key={arena.id} value={arena.id}>
                {arena.name} - {arena.location}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="text-lg font-semibold">Selected Arena</h2>
          <div className="mt-3 space-y-1 text-sm text-zinc-300">
            <p>Arena: {bookingInfo.arena}</p>
            <p>Sport: {bookingInfo.sport}</p>
            <p>Location: {bookingInfo.location}</p>
            <p>Price: {bookingInfo.price}</p>
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="text-lg font-semibold">Booking Action</h2>
          <p className="mt-2 text-sm text-zinc-400">{status}</p>
          <button
            type="button"
            onClick={confirmBooking}
            className="mt-4 rounded-xl bg-neon px-4 py-2 text-sm font-bold text-zinc-900 hover:brightness-95"
          >
            Confirm Booking
          </button>
        </article>
      </section>
    </PageShell>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingContent />
    </Suspense>
  );
}
