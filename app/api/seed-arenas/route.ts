import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/*
 * POST /api/seed-arenas
 *
 * Seeds the turfs table with sample sports arenas in Indian cities.
 * Requires the caller to be authenticated. Uses the caller's ID as owner_id.
 * Idempotent — skips arenas that already exist (matched by name).
 */

const SAMPLE_ARENAS = [
  // Chandigarh
  { name: "Elante Arena", location: "Elante Mall, Industrial Area Phase I, Chandigarh", price_per_hour: 800, latitude: 30.7059, longitude: 76.8017, time_zone: "Asia/Kolkata", amenities: ["Floodlights", "Changing Rooms", "Parking"] },
  { name: "Sector 42 Sports Complex", location: "Sector 42-D, Chandigarh", price_per_hour: 500, latitude: 30.7266, longitude: 76.7660, time_zone: "Asia/Kolkata", amenities: ["Multi-sport", "Track", "Gym"] },
  { name: "Lake Club Turf", location: "Sukhna Lake Road, Sector 1, Chandigarh", price_per_hour: 1200, latitude: 30.7421, longitude: 76.8188, time_zone: "Asia/Kolkata", amenities: ["Premium Turf", "Cafe", "Pro Shop"] },
  { name: "PCA Stadium Grounds", location: "PCA Stadium, Sector 63, Mohali", price_per_hour: 1500, latitude: 30.6932, longitude: 76.7363, time_zone: "Asia/Kolkata", amenities: ["Cricket Nets", "Coaching", "Professional Grade"] },
  { name: "Kicksal Indoor Arena", location: "IT Park, Sector 13, Chandigarh", price_per_hour: 700, latitude: 30.7651, longitude: 76.7870, time_zone: "Asia/Kolkata", amenities: ["Indoor", "5v5 Football", "Air Conditioned"] },
  { name: "PlayAll Sports Hub", location: "Manimajra, Chandigarh", price_per_hour: 600, latitude: 30.7324, longitude: 76.8367, time_zone: "Asia/Kolkata", amenities: ["Badminton", "Table Tennis", "Snack Bar"] },
  { name: "Game On Turf", location: "Sector 35-C, Chandigarh", price_per_hour: 900, latitude: 30.7271, longitude: 76.7730, time_zone: "Asia/Kolkata", amenities: ["Football", "Cricket", "Night Games"] },
  { name: "Sports Valley", location: "Phase 3B2, Mohali", price_per_hour: 550, latitude: 30.7063, longitude: 76.7201, time_zone: "Asia/Kolkata", amenities: ["Box Cricket", "Football", "Parking"] },

  // Panchkula
  { name: "Tau Devi Lal Stadium", location: "Sector 3, Panchkula", price_per_hour: 400, latitude: 30.6910, longitude: 76.8603, time_zone: "Asia/Kolkata", amenities: ["Olympic Track", "Football", "Free Entry"] },
  { name: "Panchkula Turf Zone", location: "Sector 20, Panchkula", price_per_hour: 650, latitude: 30.7048, longitude: 76.8534, time_zone: "Asia/Kolkata", amenities: ["Artificial Turf", "Lighting", "Washrooms"] },

  // Mohali / SAS Nagar
  { name: "Quail's Arena", location: "Phase 7, Industrial Area, Mohali", price_per_hour: 1000, latitude: 30.7148, longitude: 76.7452, time_zone: "Asia/Kolkata", amenities: ["Turf Football", "BBQ Area", "Lounge"] },
  { name: "Goal Street Mohali", location: "Sector 70, Mohali", price_per_hour: 750, latitude: 30.6814, longitude: 76.7280, time_zone: "Asia/Kolkata", amenities: ["7v7 Football", "Floodlights", "Changing Rooms"] },

  // Zirakpur
  { name: "The Arena Zirakpur", location: "VIP Road, Zirakpur", price_per_hour: 850, latitude: 30.6470, longitude: 76.8203, time_zone: "Asia/Kolkata", amenities: ["Multi-sport", "Cafe", "Pro Equipment"] },
  { name: "SportsFirst Hub", location: "Ambala Highway, Zirakpur", price_per_hour: 500, latitude: 30.6503, longitude: 76.8150, time_zone: "Asia/Kolkata", amenities: ["Cricket", "Basketball", "Affordable"] },

  // Delhi NCR (for users in Delhi)
  { name: "Striker Arena", location: "Sector 29, Gurgaon", price_per_hour: 1800, latitude: 28.4601, longitude: 77.0366, time_zone: "Asia/Kolkata", amenities: ["Premium", "AC Indoor", "Valet Parking"] },
  { name: "PowerPlay Sports", location: "Noida Sector 18", price_per_hour: 1200, latitude: 28.5700, longitude: 77.3218, time_zone: "Asia/Kolkata", amenities: ["Turf Football", "Cricket Nets", "Cafe"] },
];

export async function POST() {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please login first." }, { status: 401 });
    }

    // Verify user has OWNER or ADMIN role — do NOT auto-escalate
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["OWNER", "ADMIN"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Only OWNER or ADMIN accounts can seed arenas. Update your role via the Supabase dashboard." },
        { status: 403 }
      );
    }

    // Get existing turf names to avoid duplicates
    const { data: existing } = await supabase.from("turfs").select("name");
    const existingNames = new Set((existing ?? []).map((t) => t.name));

    // Filter out already-seeded arenas
    const toInsert = SAMPLE_ARENAS.filter((a) => !existingNames.has(a.name)).map((a) => ({
      ...a,
      owner_id: user.id,
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
    }));

    if (toInsert.length === 0) {
      return NextResponse.json({ message: "All arenas already seeded.", seeded: 0 });
    }

    const { data, error } = await supabase.from("turfs").insert(toInsert).select("id, name");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `Seeded ${data?.length ?? 0} arenas successfully.`,
      seeded: data?.length ?? 0,
      arenas: data?.map((t) => t.name),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
