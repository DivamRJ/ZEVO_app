export type Sport =
  | "Football"
  | "Cricket"
  | "Badminton"
  | "Volleyball"
  | "Tennis"
  | "Basketball"
  | "Pickleball"
  | "Futsal"
  | "Table Tennis"
  | "Padel"
  | "Hockey"
  | "Skating";

export type SportFilter = "All" | Sport;

export type Coords = {
  lat: number;
  lng: number;
};

export const SPORTS: Sport[] = [
  "Football",
  "Cricket",
  "Badminton",
  "Volleyball",
  "Tennis",
  "Basketball",
  "Pickleball",
  "Futsal",
  "Table Tennis",
  "Padel",
  "Hockey",
  "Skating"
];

export const FILTERS: SportFilter[] = ["All", ...SPORTS];

export const SPORT_COLLAGE: Array<{ sport: Sport; icon: string; tone: string }> = [
  { sport: "Football", icon: "⚽", tone: "from-emerald-400/30 to-emerald-700/20" },
  { sport: "Cricket", icon: "🏏", tone: "from-orange-400/30 to-orange-700/20" },
  { sport: "Badminton", icon: "🏸", tone: "from-sky-400/30 to-sky-700/20" },
  { sport: "Volleyball", icon: "🏐", tone: "from-yellow-400/30 to-yellow-700/20" },
  { sport: "Tennis", icon: "🎾", tone: "from-lime-400/30 to-lime-700/20" },
  { sport: "Basketball", icon: "🏀", tone: "from-amber-500/30 to-amber-800/20" },
  { sport: "Pickleball", icon: "🥒", tone: "from-cyan-400/30 to-cyan-700/20" },
  { sport: "Futsal", icon: "🥅", tone: "from-violet-400/30 to-violet-700/20" },
  { sport: "Table Tennis", icon: "🏓", tone: "from-pink-400/30 to-pink-700/20" },
  { sport: "Padel", icon: "🎾", tone: "from-teal-400/30 to-teal-700/20" },
  { sport: "Hockey", icon: "🏑", tone: "from-indigo-400/30 to-indigo-700/20" },
  { sport: "Skating", icon: "🛼", tone: "from-rose-400/30 to-rose-700/20" }
];

export const DEFAULT_CENTER: Coords = { lat: 30.7333, lng: 76.7794 };

export function haversineDistanceKm(a: Coords, b: Coords) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadius = 6371;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const part1 = Math.sin(dLat / 2) * Math.sin(dLat / 2);
  const part2 = Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(part1 + part2), Math.sqrt(1 - (part1 + part2)));
  return earthRadius * c;
}

export function mapEmbedUrl(center: Coords) {
  const delta = 0.09;
  const left = center.lng - delta;
  const right = center.lng + delta;
  const top = center.lat + delta;
  const bottom = center.lat - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${center.lat}%2C${center.lng}`;
}

export function getDirectionsUrl(target: Coords, origin?: Coords | null) {
  const destination = `destination=${target.lat},${target.lng}`;
  if (origin) return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&${destination}`;
  return `https://www.google.com/maps/dir/?api=1&${destination}`;
}
