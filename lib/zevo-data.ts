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

export type Turf = {
  id: string;
  name: string;
  location: string;
  sport: Sport;
  price: string;
  lat: number;
  lng: number;
  format?: string;
};

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

export const TURFS: Turf[] = [
  { id: "ground-zero", name: "Ground Zero Turf", location: "Sector 65, Kharar", sport: "Football", price: "Rs. 1400/hr", lat: 30.7488, lng: 76.6516 },
  { id: "mj-sports", name: "M J Sports Arena", location: "Sunny Enclave, Kharar", sport: "Cricket", price: "Rs. 1200/hr", format: "Box Cricket", lat: 30.7469, lng: 76.6641 },
  { id: "tiki-taka", name: "Tiki Taka Football Ground", location: "Landran Road, Kharar", sport: "Futsal", price: "Rs. 1000/hr", format: "5v5 Football", lat: 30.7256, lng: 76.6874 },
  { id: "spada", name: "Spada Arenas", location: "Shivjot Enclave", sport: "Badminton", price: "Rs. 800/hr", lat: 30.7529, lng: 76.6408 },
  { id: "smashpoint", name: "SmashPoint Courts", location: "Sector 70, Mohali", sport: "Tennis", price: "Rs. 1100/hr", lat: 30.7047, lng: 76.7279 },
  { id: "hoops-hub", name: "Hoops Hub Arena", location: "Phase 11, Mohali", sport: "Basketball", price: "Rs. 900/hr", lat: 30.6716, lng: 76.7221 },
  { id: "pickle-zone", name: "Pickle Zone", location: "Aerocity, Mohali", sport: "Pickleball", price: "Rs. 950/hr", lat: 30.6744, lng: 76.7822 },
  { id: "volley-club", name: "Volley Club", location: "Sector 48, Chandigarh", sport: "Volleyball", price: "Rs. 850/hr", lat: 30.7017, lng: 76.7677 },
  { id: "city-football-arena", name: "City Football Arena", location: "Sector 67, Mohali", sport: "Football", price: "Rs. 1350/hr", lat: 30.7083, lng: 76.6902 },
  { id: "pro-box-cricket", name: "Pro Box Cricket", location: "Phase 7, Mohali", sport: "Cricket", price: "Rs. 1250/hr", format: "Box Cricket", lat: 30.7075, lng: 76.7181 },
  { id: "netplay-badminton", name: "NetPlay Badminton Courts", location: "Sector 79, Mohali", sport: "Badminton", price: "Rs. 750/hr", lat: 30.6629, lng: 76.7324 },
  { id: "ace-badminton-hub", name: "Ace Badminton Hub", location: "Zirakpur Patiala Road", sport: "Badminton", price: "Rs. 820/hr", lat: 30.6455, lng: 76.8172 },
  { id: "pickle-pro-arena", name: "Pickle Pro Arena", location: "Sector 68, Mohali", sport: "Pickleball", price: "Rs. 980/hr", lat: 30.7029, lng: 76.7017 },
  { id: "north-pickle-courts", name: "North Pickle Courts", location: "Sector 26, Chandigarh", sport: "Pickleball", price: "Rs. 1020/hr", lat: 30.7454, lng: 76.8017 },
  { id: "table-smash-studio", name: "Table Smash Studio", location: "Sector 35, Chandigarh", sport: "Table Tennis", price: "Rs. 650/hr", lat: 30.7308, lng: 76.7691 },
  { id: "spin-serve-tt", name: "Spin & Serve TT Club", location: "Kharar-Landran Road", sport: "Table Tennis", price: "Rs. 600/hr", lat: 30.7192, lng: 76.6763 },
  { id: "padel-bay", name: "Padel Bay Courts", location: "Sector 34A, Chandigarh", sport: "Padel", price: "Rs. 1500/hr", lat: 30.7234, lng: 76.7638 },
  { id: "hockey-practice-ground", name: "Hockey Practice Ground", location: "Sector 42 Sports Complex", sport: "Hockey", price: "Rs. 1300/hr", lat: 30.7133, lng: 76.7684 },
  { id: "urban-skate-arena", name: "Urban Skate Arena", location: "Naya Gaon, Chandigarh", sport: "Skating", price: "Rs. 500/hr", lat: 30.7732, lng: 76.7797 },
  { id: "futsal-zone-plus", name: "Futsal Zone Plus", location: "Sector 74, Mohali", sport: "Futsal", price: "Rs. 1150/hr", lat: 30.6772, lng: 76.7265 },
  { id: "indoor-volley-pro", name: "Indoor Volley Pro", location: "Industrial Area Phase 2", sport: "Volleyball", price: "Rs. 900/hr", lat: 30.7003, lng: 76.7932 },
  { id: "baseline-tennis-club", name: "Baseline Tennis Club", location: "Sector 21, Panchkula", sport: "Tennis", price: "Rs. 1150/hr", lat: 30.6938, lng: 76.8472 },
  { id: "downtown-hoops", name: "Downtown Hoops Court", location: "Sector 44, Chandigarh", sport: "Basketball", price: "Rs. 920/hr", lat: 30.7054, lng: 76.7614 }
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
