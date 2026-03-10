const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
const AUTH_STORAGE_KEY = "zevo_auth_session";

function safeParse(raw, fallback = null) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function getStoredAuthSession() {
  if (typeof window === "undefined") return null;
  return safeParse(window.localStorage.getItem(AUTH_STORAGE_KEY));
}

export function setStoredAuthSession(session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("zevo-auth-changed"));
}

export function clearStoredAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("zevo-auth-changed"));
}

function getAuthToken() {
  const session = getStoredAuthSession();
  return session?.token || null;
}

function toQueryString(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const output = searchParams.toString();
  return output ? `?${output}` : "";
}

async function apiRequest(path, options = {}) {
  const { method = "GET", body, query, auth = false } = options;

  const headers = {
    "Content-Type": "application/json"
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (auth) {
    throw new Error("Authentication required. Please log in.");
  }

  const response = await fetch(`${API_BASE_URL}${path}${toQueryString(query)}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

export async function login(credentials) {
  const payload = await apiRequest("/auth/login", {
    method: "POST",
    body: credentials
  });

  setStoredAuthSession(payload);
  return payload;
}

export async function signup(details) {
  const payload = await apiRequest("/auth/signup", {
    method: "POST",
    body: details
  });

  setStoredAuthSession(payload);
  return payload;
}

export async function getCurrentUser() {
  const payload = await apiRequest("/auth/me", {
    method: "GET",
    auth: true
  });

  return payload.user;
}

export async function getTurfs() {
  const payload = await apiRequest("/turfs", {
    method: "GET"
  });

  return payload.turfs || [];
}

export async function getAvailableSlots({ turf_id, date, slot_minutes, slotMinutes = 60 }) {
  const minutes = slot_minutes ?? slotMinutes;
  return apiRequest("/available-slots", {
    method: "GET",
    query: {
      turf_id,
      date,
      slot_minutes: minutes
    }
  });
}

export async function lockBooking({ turf_id, start_time, end_time }) {
  return apiRequest("/bookings/lock", {
    method: "POST",
    auth: true,
    body: {
      turf_id,
      start_time,
      end_time
    }
  });
}

export async function confirmBookingPayment({ booking_id }) {
  return apiRequest(`/bookings/${booking_id}/confirm-payment`, {
    method: "POST",
    auth: true
  });
}
