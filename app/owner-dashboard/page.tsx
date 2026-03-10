 "use client";

import { useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageShell } from "@/components/zevo/page-shell";
import { useAuth } from "@/context/auth-context";
import { createClient } from "@/utils/supabase/client";

type OwnerTurfRow = {
  id: string;
  owner_id: string;
  name: string;
  location: string;
  price_per_hour: number;
  time_zone: string;
};

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const [turfs, setTurfs] = useState<OwnerTurfRow[]>([]);
  const [status, setStatus] = useState("Loading owner dashboard...");

  useEffect(() => {
    const loadTurfs = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("turfs")
          .select("id, owner_id, name, location, price_per_hour, time_zone, is_active")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        const rows: OwnerTurfRow[] =
          data?.map((row) => ({
            id: row.id as string,
            owner_id: row.owner_id as string,
            name: row.name as string,
            location: row.location as string,
            price_per_hour: Number(row.price_per_hour ?? 0),
            time_zone: row.time_zone as string
          })) ?? [];

        setTurfs(rows);
        setStatus("Owner inventory synced with Supabase.");
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
            <article key={turf.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <p className="text-sm font-semibold">{turf.location}</p>
              <p className="mt-1 text-xs text-zinc-400">Turf ID: {turf.id}</p>
              <p className="mt-2 text-sm text-zinc-300">Price/hr: Rs. {turf.price_per_hour}</p>
              <p className="text-xs text-zinc-500">Timezone: {turf.time_zone}</p>
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
