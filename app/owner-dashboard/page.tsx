"use client";

import { useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageShell } from "@/components/zevo/page-shell";
import { useAuth } from "@/context/auth-context";
import { getTurfs, type TurfApi } from "@/lib/api-client";

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const [turfs, setTurfs] = useState<TurfApi[]>([]);
  const [status, setStatus] = useState("Loading owner dashboard...");

  useEffect(() => {
    const loadTurfs = async () => {
      try {
        const allTurfs = await getTurfs();
        setTurfs(allTurfs);
        setStatus("Owner inventory synced with backend.");
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Failed to load owner data.";
        setStatus(message);
      }
    };

    void loadTurfs();
  }, []);

  const ownedTurfs = useMemo(
    () => turfs.filter((turf) => turf.owner_id === user?.id),
    [turfs, user?.id]
  );

  return (
    <PageShell>
      <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
        <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h1 className="text-3xl font-black">Owner Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-400">Protected route with role-based access (`OWNER` or `ADMIN`).</p>
          <p className="mt-3 text-xs text-zinc-300">{status}</p>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ownedTurfs.map((turf) => (
            <article key={turf.turf_id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <p className="text-sm font-semibold">{turf.location}</p>
              <p className="mt-1 text-xs text-zinc-400">Turf ID: {turf.turf_id}</p>
              <p className="mt-2 text-sm text-zinc-300">Price/hr: Rs. {turf.price_per_hour}</p>
              <p className="text-xs text-zinc-500">Timezone: {turf.timezone}</p>
            </article>
          ))}
        </section>

        {ownedTurfs.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">No turfs mapped to this owner account.</p>
        ) : null}
      </ProtectedRoute>
    </PageShell>
  );
}
