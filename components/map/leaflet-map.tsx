"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";

type TurfData = {
  id: string;
  name: string;
  price_per_hour: number;
  latitude: number;
  longitude: number;
};

type LeafletMapProps = {
  center: [number, number];
  zoom: number;
  turfs: TurfData[];
  markerIcons: Record<string, L.Icon | L.DivIcon>;
  userCoords: { lat: number; lng: number } | null;
  routeCoords: [number, number][];
  onTurfClick: (id: string) => void;
  onMapReady: (map: L.Map) => void;
};

// Sub-component to notify parent when map is ready
function MapReadyNotifier({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();
  const notified = useRef(false);
  useEffect(() => {
    if (!notified.current) {
      notified.current = true;
      onReady(map);
    }
  }, [map, onReady]);
  return null;
}

const userLocationIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 8px rgba(59,130,246,0.6);"></div>`,
  className: "user-marker",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function LeafletMap({
  center,
  zoom,
  turfs,
  markerIcons,
  userCoords,
  routeCoords,
  onTurfClick,
  onMapReady,
}: LeafletMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <MapReadyNotifier onReady={onMapReady} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {turfs.map((turf) => (
        <Marker
          key={turf.id}
          position={[turf.latitude, turf.longitude]}
          icon={markerIcons[turf.id] || undefined}
          eventHandlers={{ click: () => onTurfClick(turf.id) }}
        >
          <Popup>
            <div className="text-zinc-900">
              <p className="font-bold">{turf.name}</p>
              <p className="text-sm">₹{turf.price_per_hour}/hr</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {userCoords && (
        <Marker position={[userCoords.lat, userCoords.lng]} icon={userLocationIcon}>
          <Popup><span className="text-zinc-900 font-semibold">You are here</span></Popup>
        </Marker>
      )}

      {routeCoords.length > 0 && (
        <Polyline
          positions={routeCoords}
          pathOptions={{ color: "#22d3ee", weight: 4, opacity: 0.85, dashArray: "8, 6" }}
        />
      )}
    </MapContainer>
  );
}
