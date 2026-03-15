"use client";

import L from "leaflet";

export type MarkerColor = "green" | "amber" | "red";

const COLOR_MAP: Record<MarkerColor, { fill: string; stroke: string }> = {
  green: { fill: "#22c55e", stroke: "#166534" },
  amber: { fill: "#f59e0b", stroke: "#92400e" },
  red: { fill: "#ef4444", stroke: "#991b1b" },
};

export function createTurfIcon(color: MarkerColor = "green") {
  const { fill, stroke } = COLOR_MAP[color];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z"
        fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
      <circle cx="14" cy="13" r="5" fill="white" fill-opacity="0.9"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: "custom-turf-marker",
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
}

export function getMarkerColor(pricePerHour: number): MarkerColor {
  // Simple heuristic: lower-priced turfs are "available" (green),
  // mid-range are "limited" (amber), high-end are "premium" (red).
  if (pricePerHour <= 600) return "green";
  if (pricePerHour <= 1500) return "amber";
  return "red";
}
