"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PageShell } from "@/components/zevo/page-shell";

export default function BookingsPage() {
  const params = useSearchParams();
  const [status, setStatus] = useState("Complete your details to continue booking.");

  const bookingInfo = useMemo(() => {
    return {
      arena: params.get("arena") ?? "Select an arena from Discover",
      sport: params.get("sport") ?? "Sport not selected",
      location: params.get("location") ?? "Location not selected",
      price: params.get("price") ?? "Price not available"
    };
  }, [params]);

  const confirmBooking = () => {
    setStatus("Booking request submitted. Arena host will confirm your slot shortly.");
  };

  return (
    <PageShell>
      <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
        <h1 className="text-3xl font-black">Bookings</h1>
        <p className="mt-2 text-sm text-zinc-400">Review arena details and proceed to confirm your booking.</p>
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
