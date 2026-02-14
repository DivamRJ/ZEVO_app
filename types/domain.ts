export type SkillLevel = "Rookie" | "Pro" | "Elite";
export type ParticipantStatus = "confirmed" | "waitlist";
export type MatchStatus = "open" | "full" | "completed" | "cancelled";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  skill_level: SkillLevel;
  rep_score: number;
  favorite_sports: string[];
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  name: string;
  lat: number;
  long: number;
  price_hr: number;
  amenities: string[];
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  host_id: string;
  venue_id: string;
  start_time: string;
  sport_type: string;
  max_players: number;
  cost_per_head: number;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  match_id: string;
  user_id: string;
  status: ParticipantStatus;
  created_at: string;
}
