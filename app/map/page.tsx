 "use client";

import { useEffect, useMemo, useState } from "react";

import { PageShell } from "@/components/zevo/page-shell";
import { createClient } from "@/utils/supabase/client";

type TurfRow = {
  id: string;
  name: string;
  location: string;
  price_per_hour: number;
  time_zone: string;
};

type Coords = {
  lat: number;
  lng: number;
};

function mapEmbedForLocation(location: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
}

function directionsUrl(destination: string, origin?: Coords | null) {
  if (origin) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${encodeURIComponent(destination)}`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export default function MapPage() {
  const [turfs, setTurfs] = useState<TurfRow[]>([]);
  const [selectedTurfId, setSelectedTurfId] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState("Loading live turf map data...");

  useEffect(() => {
    const loadTurfs = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("turfs")
          .select("id, name, location, price_per_hour, time_zone")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        const rows: TurfRow[] =
          data?.map((row) => ({
            id: row.id as string,
            name: row.name as string,
            location: row.location as string,
            price_per_hour: Number(row.price_per_hour ?? 0),
            time_zone: row.time_zone as string
          })) ?? [];

        setTurfs(rows);

        if (rows.length) {
          setSelectedTurfId(rows[0].id);
          setStatus("Live turf list loaded from Supabase.");
        } else {
          setStatus("No turfs available in database.");
        }
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Failed to load turfs.";
        setStatus(message);
      }
    };

    void loadTurfs();
  }, []);

  const selectedTurf = useMemo(() => {
    if (!selectedTurfId) return null;
    return turfs.find((turf) => turf.id === selectedTurfId) || null;
  }, [turfs, selectedTurfId]);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setStatus("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserCoords({ lat: coords.latitude, lng: coords.longitude });
        setStatus("Location fetched. You can open directions now.");
      },
      () => setStatus("Location permission denied."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <PageShell>
      <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
        <h1 className="text-3xl font-black">Live Sports Arena Map</h1>
        <p className="mt-2 text-sm text-zinc-400">Map and directions now use live backend turf locations.</p>
        <p className="mt-3 text-xs text-zinc-300">{status}</p>
      </section>

      <section className="mb-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={requestUserLocation}
          className="rounded-xl bg-neon px-4 py-2 text-sm font-bold text-zinc-900"
        >
          Use My Location
        </button>
        <button
          type="button"
          disabled={!selectedTurf}
          onClick={() => {
            if (!selectedTurf) return;
            window.open(directionsUrl(selectedTurf.location, userCoords), "_blank", "noopener,noreferrer");
          }}
          className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-500 disabled:opacity-60"
        >
          Get Directions
        </button>
      </section>

      <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <h2 className="text-sm font-semibold">Map Focus</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/70 p-3">
            <p className="text-[11px] uppercase tracking-wide text-zinc-400">Selected Arena</p>
            <p className="mt-1 text-sm text-zinc-100">{selectedTurf?.name || "None"}</p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/70 p-3">
            <p className="text-[11px] uppercase tracking-wide text-zinc-400">Location</p>
            <p className="mt-1 text-sm text-zinc-100">{selectedTurf?.location || "--"}</p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/70 p-3">
            <p className="text-[11px] uppercase tracking-wide text-zinc-400">Timezone</p>
            <p className="mt-1 text-sm text-zinc-100">{selectedTurf?.time_zone || "--"}</p>
          </div>
        </div>
      </section>

      <section className="mb-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
        {selectedTurf ? (
          <iframe
            title="ZEVO sports arena map"
            src={mapEmbedForLocation(selectedTurf.location)}
            className="h-[380px] w-full"
            loading="lazy"
          />
        ) : (
          <div className="flex h-[380px] items-center justify-center text-sm text-zinc-400">Select a turf to view map.</div>
        )}
      </section>

      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {turfs.map((turf) => (
          <button
            key={turf.id}
            type="button"
            onClick={() => setSelectedTurfId(turf.id)}
            className={`rounded-xl border p-3 text-left text-sm transition ${
              selectedTurfId === turf.id
                ? "border-neon bg-neon/10 text-zinc-100"
                : "border-zinc-800 bg-zinc-900/70 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            <p className="font-semibold">{turf.name}</p>
            <p className="text-xs text-zinc-400">{turf.location}</p>
            <p className="text-xs text-zinc-500">Rs. {turf.price_per_hour}/hour</p>
          </button>
        ))}
      </section>
    </PageShell>
  );
}
