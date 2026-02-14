import type { Sport } from "@/lib/zevo-data";

export type Profile = {
  name: string;
  city: string;
  skillLevel: "Beginner" | "Intermediate" | "Advanced";
  interests: Sport[];
};

export type StoredProfile = Profile & {
  profileId: string;
  createdAt: string;
  updatedAt: string;
};

export type HelpRequest = {
  name: string;
  email: string;
  message: string;
  submittedAt: string;
};

export type ChatMessage = {
  id: string;
  senderName: string;
  text: string;
  type: "text" | "meetup";
  meetupVenue?: string;
  meetupTime?: string;
  createdAt: string;
};

export type ArenaChatRoom = {
  id: string;
  arenaId: string;
  arenaName: string;
  sport: Sport;
  topic: string;
  createdBy: string;
  createdAt: string;
};

export type ArenaRoomMessage = {
  id: string;
  roomId: string;
  senderName: string;
  text: string;
  createdAt: string;
};

const PROFILE_KEY = "zevo_profile";
const PROFILES_KEY = "zevo_profiles_public";
const CHAT_KEY = "zevo_public_chat";
const ARENA_CHAT_ROOMS_KEY = "zevo_arena_chat_rooms";
const ARENA_CHAT_MESSAGES_KEY = "zevo_arena_chat_messages";
const HELP_KEY = "zevo_help_requests";
const THEME_KEY = "zevo_theme";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

export function setTheme(theme: "dark" | "light") {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, theme);
}

export function getProfile(): StoredProfile | null {
  if (typeof window === "undefined") return null;
  return safeParse<StoredProfile | null>(localStorage.getItem(PROFILE_KEY), null);
}

export function saveProfile(next: StoredProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next));

  const existing = getPublicProfiles().filter((p) => p.profileId !== next.profileId);
  const merged = [next, ...existing].slice(0, 200);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(merged));
  window.dispatchEvent(new CustomEvent("zevo-profile-updated"));
}

export function getPublicProfiles(): StoredProfile[] {
  if (typeof window === "undefined") return [];
  return safeParse<StoredProfile[]>(localStorage.getItem(PROFILES_KEY), []);
}

export function getPublicChat(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  return safeParse<ChatMessage[]>(localStorage.getItem(CHAT_KEY), []);
}

export function savePublicChat(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-300)));
}

export function getArenaChatRooms(): ArenaChatRoom[] {
  if (typeof window === "undefined") return [];
  return safeParse<ArenaChatRoom[]>(localStorage.getItem(ARENA_CHAT_ROOMS_KEY), []);
}

export function saveArenaChatRooms(rooms: ArenaChatRoom[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ARENA_CHAT_ROOMS_KEY, JSON.stringify(rooms.slice(0, 300)));
}

export function getArenaChatMessages(): ArenaRoomMessage[] {
  if (typeof window === "undefined") return [];
  return safeParse<ArenaRoomMessage[]>(localStorage.getItem(ARENA_CHAT_MESSAGES_KEY), []);
}

export function saveArenaChatMessages(messages: ArenaRoomMessage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ARENA_CHAT_MESSAGES_KEY, JSON.stringify(messages.slice(-1000)));
}

export function appendHelpRequest(request: HelpRequest) {
  if (typeof window === "undefined") return;
  const existing = safeParse<HelpRequest[]>(localStorage.getItem(HELP_KEY), []);
  existing.push(request);
  localStorage.setItem(HELP_KEY, JSON.stringify(existing));
}
