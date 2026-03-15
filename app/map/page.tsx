"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import type L from "leaflet";
import { MapPin, Locate, Route, Loader2 } from "lucide-react";

import { PageShell } from "@/components/zevo/page-shell";
import { MapSidebar } from "@/components/map/map-sidebar";
import { createClient } from "@/utils/supabase/client";

const LeafletMap = dynamic(() => import("@/components/map/leaflet-map"), { ssr: false });

type TurfRow = {
  id: string;
  name: string;
  location: string;
  price_per_hour: number;
  time_zone: string;
  latitude: number | null;
  longitude: number | null;
};

type Coords = { lat: number; lng: number };

const DEFAULT_CENTER: Coords = { lat: 30.7333, lng: 76.7794 };

function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b: number, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

export default function MapPage() {
  const [turfs, setTurfs] = useState<TurfRow[]>([]);
  const [selectedTurf, setSelectedTurf] = useState<TurfRow | null>(null);
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState("Loading live turf map…");
  const [mapReady, setMapReady] = useState(false);
  const [markerIcons, setMarkerIcons] = useState<Record<string, L.Icon | L.DivIcon>>({});

  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Load turfs
  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("turfs")
          .select("id, name, location, price_per_hour, time_zone, latitude, longitude")
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        if (error) throw error;
        const rows: TurfRow[] = data?.map((r) => ({
          id: r.id as string, name: r.name as string, location: r.location as string,
          price_per_hour: Number(r.price_per_hour ?? 0), time_zone: r.time_zone as string,
          latitude: r.latitude != null ? Number(r.latitude) : null,
          longitude: r.longitude != null ? Number(r.longitude) : null,
        })) ?? [];
        setTurfs(rows);
        setStatus(rows.length ? `${rows.length} arenas loaded` : "No turfs found.");
      } catch (e) { setStatus(e instanceof Error ? e.message : "Failed to load turfs."); }
    };
    void load();
  }, []);

  // Build marker icons client-side
  useEffect(() => {
    import("@/components/map/map-marker").then(({ createTurfIcon, getMarkerColor }) => {
      const icons: Record<string, L.Icon | L.DivIcon> = {};
      turfs.forEach((t) => { icons[t.id] = createTurfIcon(getMarkerColor(t.price_per_hour)); });
      setMarkerIcons(icons);
      setMapReady(true);
    });
  }, [turfs]);

  const mappableTurfs = useMemo(
    () => turfs.filter((t) => t.latitude != null && t.longitude != null).map((t) => ({
      id: t.id, name: t.name, price_per_hour: t.price_per_hour,
      latitude: t.latitude!, longitude: t.longitude!,
    })),
    [turfs]
  );

  const mapCenter = useMemo<[number, number]>(() => {
    if (userCoords) return [userCoords.lat, userCoords.lng];
    if (mappableTurfs.length > 0) return [mappableTurfs[0].latitude, mappableTurfs[0].longitude];
    return [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];
  }, [userCoords, mappableTurfs]);

  const requestUserLocation = () => {
    if (!navigator.geolocation) { setStatus("Geolocation not supported."); return; }
    setStatus("Acquiring location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setUserCoords({ lat: coords.latitude, lng: coords.longitude }); setStatus("Location acquired."); },
      () => setStatus("Location permission denied."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const fetchRouteFromOSRM = async (origin: Coords, turf: TurfRow) => {
    if (turf.latitude == null || turf.longitude == null) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(turf.location)}`, "_blank");
      return;
    }
    try {
      setLoadingRoute(true);
      setStatus("Calculating route…");
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${turf.longitude},${turf.latitude}?overview=full&geometries=polyline`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.code !== "Ok" || !json.routes?.length) {
        setStatus("Could not calculate route. Opening Google Maps…");
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${turf.latitude},${turf.longitude}`, "_blank");
        return;
      }
      const route = json.routes[0];
      const decoded = decodePolyline(route.geometry);
      setRouteCoords(decoded);
      const distKm = (route.distance / 1000).toFixed(1);
      const durMin = Math.round(route.duration / 60);
      setRouteInfo({ distance: `${distKm} km`, duration: `${durMin} min` });
      setStatus(`Route: ${distKm} km · ~${durMin} min`);

      // Auto-fit bounds
      if (mapInstanceRef.current) {
        const Leaflet = await import("leaflet");
        const bounds = Leaflet.latLngBounds(decoded.map(([lat, lng]) => Leaflet.latLng(lat, lng)));
        mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60] });
      }
    } catch { setStatus("Route calculation failed."); }
    finally { setLoadingRoute(false); }
  };

  const fetchDirections = async (turf: TurfRow) => {
    if (!userCoords) {
      if (!navigator.geolocation) { setStatus("Geolocation not supported."); return; }
      setStatus("Requesting location for directions…");
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const loc = { lat: coords.latitude, lng: coords.longitude };
          setUserCoords(loc);
          void fetchRouteFromOSRM(loc, turf);
        },
        () => setStatus("Location permission denied."),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
      return;
    }
    await fetchRouteFromOSRM(userCoords, turf);
  };

  const clearRoute = () => { setRouteCoords([]); setRouteInfo(null); };

  const handleTurfClick = useCallback((id: string) => {
    const turf = turfs.find((t) => t.id === id) ?? null;
    setSelectedTurf(turf);
    clearRoute();
  }, [turfs]);

  const handleMapReady = useCallback((map: L.Map) => {
    mapInstanceRef.current = map;
  }, []);

  return (
    <PageShell>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-neon/15 p-2"><MapPin size={20} className="text-neon" /></div>
          <div>
            <h1 className="text-2xl font-black">Live Arena Map</h1>
            <p className="text-xs text-zinc-400">{status}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={requestUserLocation} className="btn-primary flex items-center gap-2 text-xs">
            <Locate size={14} /> My Location
          </button>
          {routeCoords.length > 0 && (
            <button type="button" onClick={clearRoute} className="btn-secondary flex items-center gap-2 text-xs">Clear Route</button>
          )}
        </div>
      </motion.div>

      {/* Route info bar */}
      {routeInfo && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-3 flex items-center gap-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-2.5 text-sm">
          <Route size={16} className="text-cyan-400" />
          <span className="font-semibold text-cyan-300">{routeInfo.distance}</span>
          <span className="text-zinc-400">·</span>
          <span className="text-zinc-300">~{routeInfo.duration} drive</span>
          {selectedTurf && <><span className="text-zinc-400">·</span><span className="text-zinc-400">to {selectedTurf.name}</span></>}
        </motion.div>
      )}

      {/* Map + Sidebar */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/50" style={{ height: "calc(100vh - 260px)", minHeight: 400 }}>
        {mapReady ? (
          <LeafletMap
            center={mapCenter}
            zoom={13}
            turfs={mappableTurfs}
            markerIcons={markerIcons}
            userCoords={userCoords}
            routeCoords={routeCoords}
            onTurfClick={handleTurfClick}
            onMapReady={handleMapReady}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-900">
            <Loader2 size={24} className="animate-spin text-zinc-500" />
          </div>
        )}

        <MapSidebar
          turf={selectedTurf}
          routeInfo={routeInfo}
          loadingRoute={loadingRoute}
          onClose={() => { setSelectedTurf(null); clearRoute(); }}
          onGetDirections={() => { if (selectedTurf) void fetchDirections(selectedTurf); }}
        />
      </div>

      {/* Legend */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
        <span className="font-semibold text-zinc-300">Legend:</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> ≤₹600/hr</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> ≤₹1500/hr</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> &gt;₹1500/hr</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-white bg-blue-500" /> You</span>
        {routeCoords.length > 0 && <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-cyan-400 rounded" /> Route</span>}
      </motion.div>

      {/* Turf list */}
      {turfs.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">All Arenas</h2>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {turfs.map((turf, i) => (
              <motion.button key={turf.id} type="button" initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.25, delay: i * 0.04 }}
                onClick={() => { setSelectedTurf(turf); clearRoute(); }}
                className={`glass-card p-3 text-left ${selectedTurf?.id === turf.id ? "border-neon/50 bg-neon/10" : ""}`}
              >
                <p className="text-sm font-semibold text-zinc-100">{turf.name}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{turf.location}</p>
                <p className="mt-1 text-xs text-zinc-500">₹{turf.price_per_hour}/hr</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
