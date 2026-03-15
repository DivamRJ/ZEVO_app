"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, MapPin } from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageShell } from "@/components/zevo/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
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
  const [status, setStatus] = useState("Loading owner dashboard…");

  useEffect(() => {
    const loadTurfs = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from("turfs").select("id, owner_id, name, location, price_per_hour, time_zone, is_active").order("created_at", { ascending: false });
        if (error) throw error;
        const rows: OwnerTurfRow[] = data?.map((row) => ({ id: row.id as string, owner_id: row.owner_id as string, name: row.name as string, location: row.location as string, price_per_hour: Number(row.price_per_hour ?? 0), time_zone: row.time_zone as string })) ?? [];
        setTurfs(rows);
        setStatus("Owner inventory synced.");
      } catch (caughtError) {
        setStatus(caughtError instanceof Error ? caughtError.message : "Failed to load owner data.");
      }
    };
    void loadTurfs();
  }, []);

  const ownedTurfs = useMemo(() => turfs.filter((turf) => turf.owner_id === user?.id), [turfs, user?.id]);

  return (
    <PageShell>
      <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
        {/* Header */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="glass-panel mb-6 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-neon/15 p-2"><LayoutDashboard size={18} className="text-neon" /></div>
            <div>
              <h1 className="text-2xl font-black">Owner Dashboard</h1>
              <p className="mt-1 text-xs text-zinc-400">{status}</p>
            </div>
          </div>
        </motion.section>

        <SectionHeader title="Your Turfs" badge={`${ownedTurfs.length}`} subtitle="Arenas mapped to your owner account" />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ownedTurfs.map((turf, i) => (
            <motion.article
              key={turf.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="glass-card-glow p-5"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-zinc-800/60 p-2">
                  <MapPin size={16} className="text-neon" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-zinc-100 truncate">{turf.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">{turf.location}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-bold text-zinc-200">₹{turf.price_per_hour}<span className="ml-1 text-xs font-normal text-zinc-500">/hr</span></p>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wide">{turf.time_zone}</span>
              </div>
            </motion.article>
          ))}
        </div>

        {ownedTurfs.length === 0 && (
          <div className="glass-card mt-4 p-5">
            <p className="text-sm text-zinc-400">No turfs mapped to this owner account.</p>
          </div>
        )}
      </ProtectedRoute>
    </PageShell>
  );
}
