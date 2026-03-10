import axios from "axios";

function normalizeApiBase(baseUrl) {
  const trimmed = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

function resolveApiBaseUrl() {
  const configuredBase = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Vercel/production: frontend and backend functions share domain.
  if (process.env.NODE_ENV === "production") {
    return configuredBase ? normalizeApiBase(configuredBase) : "/api";
  }

  // Local dev: support either direct backend (4000) or frontend proxy (3000).
  if (configuredBase) {
    return normalizeApiBase(configuredBase);
  }

  return "http://localhost:4000/api";
}

const API_BASE_URL = resolveApiBaseUrl();
const AUTH_STORAGE_KEY = "zevo_auth_session";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

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

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearStoredAuthSession();
    }

    const message = error?.response?.data?.error || error?.message || "Request failed.";
    return Promise.reject(new Error(message));
  }
);

async function apiRequest(path, options = {}) {
  const { method = "GET", body, query, auth = false } = options;

  if (auth && !getAuthToken()) {
    throw new Error("Authentication required. Please log in.");
  }

  const response = await api.request({
    url: path,
    method,
    params: query,
    data: body
  });

  return response.data;
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

export async function updateUserProfile(data) {
  const payload = await apiRequest("/auth/profile", {
    method: "PUT",
    auth: true,
    body: data
  });

  const session = getStoredAuthSession();

  if (session?.token && payload?.user) {
    setStoredAuthSession({ token: session.token, user: payload.user });
  }

  return payload;
}

export async function addWalletFunds(amount) {
  const payload = await apiRequest("/auth/wallet/topup", {
    method: "POST",
    auth: true,
    body: { amount }
  });

  const session = getStoredAuthSession();

  if (session?.token && payload?.user) {
    setStoredAuthSession({ token: session.token, user: payload.user });
  }

  return payload;
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

export async function getActiveBookings() {
  const payload = await apiRequest("/bookings/active", {
    method: "GET",
    auth: true
  });

  return payload.bookings || [];
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
