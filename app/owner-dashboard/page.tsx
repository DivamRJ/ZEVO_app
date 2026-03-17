"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, MapPin, Plus, X, ToggleLeft, ToggleRight, Pencil, Save, Loader2, IndianRupee } from "lucide-react";

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
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
};

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const [turfs, setTurfs] = useState<OwnerTurfRow[]>([]);
  const [status, setStatus] = useState("Loading owner dashboard…");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

  // Create form state
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newLat, setNewLat] = useState("");
  const [newLng, setNewLng] = useState("");

  // Load turfs
  useEffect(() => {
    if (!user?.id) return;
    const loadTurfs = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("turfs")
          .select("id, owner_id, name, location, price_per_hour, time_zone, latitude, longitude, is_active")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setTurfs(
          data?.map((row) => ({
            id: row.id as string,
            owner_id: row.owner_id as string,
            name: row.name as string,
            location: row.location as string,
            price_per_hour: Number(row.price_per_hour ?? 0),
            time_zone: row.time_zone as string,
            latitude: row.latitude != null ? Number(row.latitude) : null,
            longitude: row.longitude != null ? Number(row.longitude) : null,
            is_active: row.is_active as boolean,
          })) ?? []
        );
        setStatus("Dashboard loaded.");
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Failed to load owner data.");
      }
    };
    void loadTurfs();
  }, [user?.id]);

  const ownedTurfs = turfs;
  const activeTurfs = useMemo(() => ownedTurfs.filter((t) => t.is_active), [ownedTurfs]);
  const totalRevenuePotential = useMemo(() => ownedTurfs.reduce((acc, t) => acc + t.price_per_hour, 0), [ownedTurfs]);

  // Create turf
  const createTurf = async () => {
    if (!user || !newName.trim() || !newLocation.trim() || !newPrice.trim()) {
      setStatus("Fill in name, location, and price.");
      return;
    }
    setCreating(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("turfs")
        .insert({
          owner_id: user.id,
          name: newName.trim(),
          location: newLocation.trim(),
          price_per_hour: Number(newPrice),
          time_zone: "Asia/Kolkata",
          latitude: newLat ? Number(newLat) : null,
          longitude: newLng ? Number(newLng) : null,
          is_active: true,
          operating_hours: {
            monday: { open: "06:00", close: "23:00" },
            tuesday: { open: "06:00", close: "23:00" },
            wednesday: { open: "06:00", close: "23:00" },
            thursday: { open: "06:00", close: "23:00" },
            friday: { open: "06:00", close: "23:00" },
            saturday: { open: "05:00", close: "23:59" },
            sunday: { open: "05:00", close: "23:59" },
          },
        })
        .select("id, owner_id, name, location, price_per_hour, time_zone, latitude, longitude, is_active")
        .single();
      if (error) throw error;
      if (data) {
        setTurfs((prev) => [
          { id: data.id as string, owner_id: data.owner_id as string, name: data.name as string, location: data.location as string, price_per_hour: Number(data.price_per_hour), time_zone: data.time_zone as string, latitude: data.latitude != null ? Number(data.latitude) : null, longitude: data.longitude != null ? Number(data.longitude) : null, is_active: data.is_active as boolean },
          ...prev,
        ]);
      }
      setNewName(""); setNewLocation(""); setNewPrice(""); setNewLat(""); setNewLng("");
      setShowCreateForm(false);
      setStatus("Turf created successfully!");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed to create turf.");
    } finally {
      setCreating(false);
    }
  };

  // Toggle active/inactive
  const toggleActive = async (turfId: string, currentActive: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from("turfs").update({ is_active: !currentActive }).eq("id", turfId);
      if (error) throw error;
      setTurfs((prev) => prev.map((t) => (t.id === turfId ? { ...t, is_active: !currentActive } : t)));
      setStatus(`Turf ${!currentActive ? "activated" : "deactivated"}.`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed to update turf.");
    }
  };

  // Update price
  const savePrice = async (turfId: string) => {
    if (!editPrice || isNaN(Number(editPrice))) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("turfs").update({ price_per_hour: Number(editPrice) }).eq("id", turfId);
      if (error) throw error;
      setTurfs((prev) => prev.map((t) => (t.id === turfId ? { ...t, price_per_hour: Number(editPrice) } : t)));
      setEditingId(null);
      setEditPrice("");
      setStatus("Price updated.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed to update price.");
    }
  };

  return (
    <PageShell>
      <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
        {/* Header */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="glass-panel mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-neon/15 p-2"><LayoutDashboard size={20} className="text-neon" /></div>
              <div>
                <h1 className="text-2xl font-black">Owner Dashboard</h1>
                <p className="mt-1 text-xs text-zinc-400">{status}</p>
              </div>
            </div>
            <button type="button" onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary flex items-center gap-2 text-xs">
              {showCreateForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Turf</>}
            </button>
          </div>
        </motion.section>

        {/* Stats */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Total Turfs", value: ownedTurfs.length, icon: <MapPin size={14} className="text-cyan-400" /> },
            { label: "Active", value: activeTurfs.length, icon: <ToggleRight size={14} className="text-emerald-400" /> },
            { label: "Revenue Rate", value: `₹${totalRevenuePotential}/hr`, icon: <IndianRupee size={14} className="text-amber-300" /> },
          ].map((item, i) => (
            <motion.article key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="stat-card">
              <div className="flex items-center gap-2 mb-1">{item.icon}<p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{item.label}</p></div>
              <p className="text-lg font-bold text-zinc-100">{item.value}</p>
            </motion.article>
          ))}
        </div>

        {/* Create turf form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="mb-6 overflow-hidden">
              <div className="glass-card p-5">
                <SectionHeader title="Create New Turf" />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Turf name" className="input-field" />
                  <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Location (e.g. Sector 42, Chandigarh)" className="input-field" />
                  <input value={newPrice} onChange={(e) => setNewPrice(e.target.value)} type="number" placeholder="Price per hour (₹)" className="input-field" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={newLat} onChange={(e) => setNewLat(e.target.value)} type="number" step="any" placeholder="Latitude (optional)" className="input-field" />
                    <input value={newLng} onChange={(e) => setNewLng(e.target.value)} type="number" step="any" placeholder="Longitude (optional)" className="input-field" />
                  </div>
                </div>
                <button type="button" onClick={createTurf} disabled={creating} className="btn-primary mt-4 flex items-center gap-2">
                  {creating ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : <><Plus size={14} /> Create Turf</>}
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Turf list */}
        <SectionHeader title="Your Turfs" badge={`${ownedTurfs.length}`} subtitle="Manage your arenas" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ownedTurfs.map((turf, i) => (
            <motion.article
              key={turf.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`glass-card p-5 ${!turf.is_active ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="rounded-lg bg-zinc-800/60 p-2"><MapPin size={16} className="text-neon" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-100 truncate">{turf.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{turf.location}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleActive(turf.id, turf.is_active)}
                  className="p-1 transition-all duration-300 hover:opacity-80"
                  title={turf.is_active ? "Deactivate" : "Activate"}
                >
                  {turf.is_active ? <ToggleRight size={22} className="text-emerald-400" /> : <ToggleLeft size={22} className="text-zinc-500" />}
                </button>
              </div>

              {/* Price — editable */}
              <div className="flex items-center justify-between">
                {editingId === turf.id ? (
                  <div className="flex items-center gap-2">
                    <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" className="input-field w-24 py-1 text-xs" placeholder={String(turf.price_per_hour)} />
                    <button type="button" onClick={() => savePrice(turf.id)} className="rounded-lg bg-neon p-1.5 text-zinc-900"><Save size={12} /></button>
                    <button type="button" onClick={() => { setEditingId(null); setEditPrice(""); }} className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400"><X size={12} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-zinc-100">₹{turf.price_per_hour}<span className="ml-1 text-xs font-normal text-zinc-500">/hr</span></p>
                    <button
                      type="button"
                      onClick={() => { setEditingId(turf.id); setEditPrice(String(turf.price_per_hour)); }}
                      className="rounded-lg border border-zinc-700/50 p-1 text-zinc-500 transition-all duration-300 hover:text-zinc-200 hover:border-zinc-500"
                    >
                      <Pencil size={11} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${turf.is_active ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  <span className="text-[10px] text-zinc-500">{turf.is_active ? "Active" : "Inactive"}</span>
                </div>
              </div>

              {turf.latitude && turf.longitude && (
                <p className="mt-2 text-[10px] text-zinc-500">📍 {turf.latitude.toFixed(4)}, {turf.longitude.toFixed(4)}</p>
              )}
            </motion.article>
          ))}
        </div>

        {ownedTurfs.length === 0 && (
          <div className="glass-card mt-4 p-6 text-center">
            <p className="text-sm text-zinc-400 mb-3">No turfs yet. Create your first arena!</p>
            <button type="button" onClick={() => setShowCreateForm(true)} className="btn-primary text-xs"><Plus size={14} /> Add Turf</button>
          </div>
        )}
      </ProtectedRoute>
    </PageShell>
  );
}
