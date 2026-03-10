export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "PLAYER" | "OWNER" | "ADMIN";
  walletBalance: number;
  city: string | null;
  skillLevel: string;
  interests: string[];
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type TurfApi = {
  turf_id: string;
  name: string;
  owner_id: string;
  owner_name: string | null;
  owner_email: string | null;
  location: string;
  timezone: string;
  price_per_hour: number;
  operating_hours: Record<string, { open: string; close: string; isClosed: boolean }>;
};

export type SlotApi = {
  start_time: string;
  end_time: string;
};

export function getStoredAuthSession(): AuthSession | null;
export function setStoredAuthSession(session: AuthSession): void;
export function clearStoredAuthSession(): void;
export function login(credentials: { email: string; password: string }): Promise<AuthSession>;
export function signup(details: {
  name: string;
  email: string;
  password: string;
  role?: "PLAYER" | "OWNER";
}): Promise<AuthSession>;
export function getCurrentUser(): Promise<AuthUser>;
export function updateUserProfile(data: {
  city?: string;
  skillLevel: string;
  interests: string[];
}): Promise<{ message: string; user: AuthUser }>;
export function addWalletFunds(amount: number): Promise<{ message: string; user: AuthUser }>;
export function getTurfs(): Promise<TurfApi[]>;
export function getAvailableSlots(input: {
  turf_id: string;
  date: string;
  slot_minutes?: number;
  slotMinutes?: number;
}): Promise<{ turf_id: string; date: string; time_zone: string; slots: SlotApi[] }>;
export function lockBooking(input: {
  turf_id: string;
  start_time: string;
  end_time: string;
}): Promise<{ message: string; booking: BookingApi }>;
export function confirmBookingPayment(input: {
  booking_id: string;
}): Promise<{ message: string; booking: BookingApi }>;
export function getActiveBookings(): Promise<BookingApi[]>;

export type BookingApi = {
  booking_id: string;
  user_id: string;
  turf_id: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  lock_expires_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
};
