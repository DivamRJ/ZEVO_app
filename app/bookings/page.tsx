"use client";

import { Suspense } from "react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PageShell } from "@/components/zevo/page-shell";
import { TURFS } from "@/lib/zevo-data";

function BookingContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState("Complete your details to continue booking.");
  const [bookerEmail, setBookerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
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

  const confirmBooking = async () => {
    const cleanEmail = bookerEmail.trim();
    if (!cleanEmail) {
      setStatus("Please enter your email before confirming booking.");
      return;
    }

    try {
      setSubmitting(true);
      setStatus("Submitting booking...");

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookerEmail: cleanEmail,
          booking: bookingInfo
        })
      });

      const result = (await response.json()) as { success?: boolean; message?: string; error?: string };
      if (!response.ok) {
        setStatus(result.error ?? "Booking failed. Please try again.");
        setSubmitting(false);
        return;
      }

      setStatus(result.message ?? "Booking request submitted and emailed.");
      setSubmitting(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Booking failed. Please try again.";
      setStatus(message);
      setSubmitting(false);
    }
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
        <div className="mt-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-400">Your Email</label>
          <input
            value={bookerEmail}
            onChange={(event) => setBookerEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-neon"
          />
        </div>
      </section>

      <section className="mb-4 grid gap-3 md:grid-cols-3">
        {[
          { label: "Step 1", detail: "Choose your arena and slot preference." },
          { label: "Step 2", detail: "Confirm contact email for booking updates." },
          { label: "Step 3", detail: "Receive booking confirmation by email." }
        ].map((step) => (
          <article key={step.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neon">{step.label}</p>
            <p className="mt-2 text-sm text-zinc-300">{step.detail}</p>
          </article>
        ))}
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
            disabled={submitting}
            className="mt-4 rounded-xl bg-neon px-4 py-2 text-sm font-bold text-zinc-900 hover:brightness-95 disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Confirm Booking"}
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
