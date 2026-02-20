"use client";

import { useMemo, useState } from "react";

import { PageShell } from "@/components/zevo/page-shell";
import {
  DEFAULT_CENTER,
  TURFS,
  getDirectionsUrl,
  haversineDistanceKm,
  mapEmbedUrl,
  type Coords
} from "@/lib/zevo-data";

export default function MapPage() {
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [selectedTurfId, setSelectedTurfId] = useState(TURFS[0].id);
  const [status, setStatus] = useState("Allow location to sort sports arenas near you.");

  const selectedTurf = TURFS.find((turf) => turf.id === selectedTurfId) ?? TURFS[0];
  const mapCenter = selectedTurf ? { lat: selectedTurf.lat, lng: selectedTurf.lng } : userCoords ?? DEFAULT_CENTER;

  const sortedTurfs = useMemo(() => {
    return TURFS.map((turf) => {
      const distanceKm = userCoords ? haversineDistanceKm(userCoords, { lat: turf.lat, lng: turf.lng }) : null;
      return { ...turf, distanceKm };
    }).sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [userCoords]);
  const nearestArena = sortedTurfs.find((turf) => turf.distanceKm != null);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setStatus("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserCoords({ lat: coords.latitude, lng: coords.longitude });
        setStatus("Location fetched. Sports arenas sorted by nearest distance.");
      },
      () => setStatus("Location permission denied."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <PageShell>
      <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
        <h1 className="text-3xl font-black">Live Sports Arena Map</h1>
        <p className="mt-2 text-sm text-zinc-400">Compare venues, get directions, and locate the best spot nearby.</p>
        <p className="mt-3 text-xs text-zinc-300">{status}</p>
      </section>

      <section className="mb-4 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={requestUserLocation} className="rounded-xl bg-neon px-4 py-2 text-sm font-bold text-zinc-900">
          Use My Location
        </button>
        <button
          type="button"
          onClick={() => window.open(getDirectionsUrl(mapCenter, userCoords), "_blank", "noopener,noreferrer")}
          className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-500"
        >
          Get Directions
        </button>
      </section>

      <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <h2 className="text-sm font-semibold">Proximity Intel</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/70 p-3">
            <p className="text-[11px] uppercase tracking-wide text-zinc-400">Nearest Arena</p>
            <p className="mt-1 text-sm text-zinc-100">{nearestArena?.name ?? "Enable location"}</p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/70 p-3">
            <p className="text-[11px] uppercase tracking-wide text-zinc-400">Range</p>
            <p className="mt-1 text-sm text-zinc-100">{nearestArena?.distanceKm != null ? `${nearestArena.distanceKm.toFixed(1)} km` : "--"}</p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/70 p-3">
            <p className="text-[11px] uppercase tracking-wide text-zinc-400">Map Focus</p>
            <p className="mt-1 text-sm text-zinc-100">{selectedTurf.name}</p>
          </div>
        </div>
      </section>

      <section className="mb-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
        <iframe title="ZEVO sports arena map" src={mapEmbedUrl(mapCenter)} className="h-[380px] w-full" loading="lazy" />
      </section>

      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {sortedTurfs.map((turf) => (
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
            <p className="text-xs text-zinc-500">
              {turf.distanceKm != null ? `${turf.distanceKm.toFixed(1)} km away` : "Distance unavailable"}
            </p>
          </button>
        ))}
      </section>
    </PageShell>
  );
}
