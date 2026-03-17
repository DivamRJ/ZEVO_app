"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { createClient } from "@/utils/supabase/client";
import type { BookingRow, TurfRow } from "@/app/bookings/page";

type Slot = { start_time: string; end_time: string };

type FlowState = {
  status: "IDLE" | "LOCKING" | "LOCKED" | "CONFIRMING" | "CONFIRMED" | "EXPIRED" | "ERROR";
  message: string;
  booking: BookingRow | null;
  countdownSeconds: number;
};

type Action =
  | { type: "RESET" }
  | { type: "LOCK_REQUEST" }
  | { type: "LOCK_SUCCESS"; booking: BookingRow }
  | { type: "REHYDRATE_LOCK"; booking: BookingRow }
  | { type: "LOCK_FAILURE"; message: string }
  | { type: "TICK" }
  | { type: "EXPIRE" }
  | { type: "CONFIRM_REQUEST" }
  | { type: "CONFIRM_SUCCESS"; booking: BookingRow }
  | { type: "CONFIRM_FAILURE"; message: string };

const LOCK_DURATION_SECONDS = 600; // 10 minutes

const initialState: FlowState = {
  status: "IDLE",
  message: "Select a slot to start booking.",
  booking: null,
  countdownSeconds: 0,
};

function secondsUntil(isoDate: string | null) {
  if (!isoDate) return 0;
  return Math.max(Math.floor((new Date(isoDate).getTime() - Date.now()) / 1000), 0);
}

function reducer(state: FlowState, action: Action): FlowState {
  switch (action.type) {
    case "RESET":
      return initialState;
    case "LOCK_REQUEST":
      return { ...state, status: "LOCKING", message: "Locking slot for 10 minutes…", booking: null, countdownSeconds: 0 };
    case "LOCK_SUCCESS":
      return { ...state, status: "LOCKED", message: "Slot locked. Complete payment before timer ends.", booking: action.booking, countdownSeconds: secondsUntil(action.booking.lock_expires_at) };
    case "REHYDRATE_LOCK":
      return { ...state, status: "LOCKED", message: "Recovered an active lock from backend.", booking: action.booking, countdownSeconds: secondsUntil(action.booking.lock_expires_at) };
    case "LOCK_FAILURE":
      return { ...state, status: "ERROR", message: action.message, booking: null, countdownSeconds: 0 };
    case "TICK": {
      const next = Math.max(state.countdownSeconds - 1, 0);
      return {
        ...state,
        countdownSeconds: next,
        status: next === 0 && state.status === "LOCKED" ? "EXPIRED" : state.status,
        message: next === 0 && state.status === "LOCKED" ? "Lock expired. Select the slot again." : state.message,
      };
    }
    case "EXPIRE":
      return { ...state, status: "EXPIRED", message: "Lock expired. Select the slot again.", booking: null, countdownSeconds: 0 };
    case "CONFIRM_REQUEST":
      return { ...state, status: "CONFIRMING", message: "Confirming payment…" };
    case "CONFIRM_SUCCESS":
      return { ...state, status: "CONFIRMED", message: "Payment successful. Booking confirmed.", booking: action.booking, countdownSeconds: 0 };
    case "CONFIRM_FAILURE":
      return { ...state, status: "ERROR", message: action.message };
    default:
      return state;
  }
}

function formatCountdown(seconds: number) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function validateSlot(slot: Slot) {
  const start = new Date(slot.start_time);
  const end = new Date(slot.end_time);
  if (start.getTime() <= Date.now()) return "Start time must be in the future.";
  if (end.getTime() - start.getTime() < 3600000) return "Minimum booking is 1 hour.";
  return null;
}

// Flow steps for the visual state indicator
const FLOW_STEPS = [
  { key: "IDLE", label: "Select Slot" },
  { key: "LOCKING", label: "Locking" },
  { key: "LOCKED", label: "Locked" },
  { key: "CONFIRMING", label: "Payment" },
  { key: "CONFIRMED", label: "Confirmed" },
] as const;

function getStepIndex(status: FlowState["status"]) {
  if (status === "ERROR" || status === "EXPIRED") return -1;
  const idx = FLOW_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

type BookingFormProps = {
  selectedTurf: TurfRow | null;
  selectedSlot: Slot | null;
  onBookingConfirmed?: (booking: BookingRow) => void;
};

export function BookingForm({ selectedTurf, selectedSlot, onBookingConfirmed }: BookingFormProps) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate pending lock from backend
  useEffect(() => {
    if (!selectedTurf) return;
    const hydrate = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("bookings")
          .select("id, user_id, turf_id, start_time, end_time, total_price, status, lock_expires_at, confirmed_at, completed_at, cancelled_at")
          .eq("turf_id", selectedTurf.id)
          .eq("status", "PENDING");
        if (error) return;
        const row = data?.find((r) => r.lock_expires_at && new Date(r.lock_expires_at as string).getTime() > Date.now());
        if (row) {
          dispatch({
            type: "REHYDRATE_LOCK",
            booking: {
              id: row.id as string, user_id: row.user_id as string, turf_id: row.turf_id as string,
              start_time: row.start_time as string, end_time: row.end_time as string,
              total_price: Number(row.total_price ?? 0), status: row.status as BookingRow["status"],
              lock_expires_at: row.lock_expires_at as string | null, confirmed_at: row.confirmed_at as string | null,
              completed_at: row.completed_at as string | null, cancelled_at: row.cancelled_at as string | null,
            },
          });
        }
      } catch { /* ignore */ }
    };
    void hydrate();
  }, [selectedTurf?.id]);

  // Countdown tick
  useEffect(() => {
    if (state.status !== "LOCKED") return;
    const timer = window.setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => window.clearInterval(timer);
  }, [state.status]);

  // Auto-expire
  useEffect(() => {
    if (state.status === "EXPIRED") dispatch({ type: "EXPIRE" });
  }, [state.status]);

  const canLock = Boolean(selectedTurf && selectedSlot) && state.status !== "LOCKING";
  const canConfirm = state.status === "LOCKED" && !!state.booking;

  const bookingSummary = useMemo(() => {
    if (!selectedTurf || !selectedSlot) return null;
    return { turf_id: selectedTurf.id, start_time: selectedSlot.start_time, end_time: selectedSlot.end_time };
  }, [selectedTurf, selectedSlot]);

  const requestLock = useCallback(async (turf: TurfRow, slot: Slot) => {
    const err = validateSlot(slot);
    if (err) { dispatch({ type: "LOCK_FAILURE", message: err }); return; }
    dispatch({ type: "LOCK_REQUEST" });
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) { dispatch({ type: "LOCK_FAILURE", message: "You must be logged in to book." }); return; }
      const { data, error } = await supabase
        .from("bookings")
        .insert({ user_id: userId, turf_id: turf.id, start_time: slot.start_time, end_time: slot.end_time, status: "PENDING" })
        .select("id, user_id, turf_id, start_time, end_time, total_price, status, lock_expires_at, confirmed_at, completed_at, cancelled_at")
        .single();
      if (error) throw error;
      dispatch({
        type: "LOCK_SUCCESS",
        booking: {
          id: data.id as string, user_id: data.user_id as string, turf_id: data.turf_id as string,
          start_time: data.start_time as string, end_time: data.end_time as string,
          total_price: Number(data.total_price ?? 0), status: data.status as BookingRow["status"],
          lock_expires_at: data.lock_expires_at as string | null, confirmed_at: data.confirmed_at as string | null,
          completed_at: data.completed_at as string | null, cancelled_at: data.cancelled_at as string | null,
        },
      });
    } catch (e) {
      dispatch({ type: "LOCK_FAILURE", message: e instanceof Error ? e.message : "Failed to lock slot." });
    }
  }, []);

  // Reset flow when slot changes so user can re-lock
  useEffect(() => {
    dispatch({ type: "RESET" });
  }, [selectedTurf?.id, selectedSlot?.start_time, selectedSlot?.end_time]);

  const handleLockSlot = async () => {
    if (!selectedTurf || !selectedSlot) {
      dispatch({ type: "LOCK_FAILURE", message: "Select a turf and slot before locking." });
      return;
    }
    await requestLock(selectedTurf, selectedSlot);
  };

  const handleConfirmPayment = async () => {
    if (!state.booking) return;
    dispatch({ type: "CONFIRM_REQUEST" });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bookings")
        .update({ status: "CONFIRMED" })
        .eq("id", state.booking.id)
        .select("id, user_id, turf_id, start_time, end_time, total_price, status, lock_expires_at, confirmed_at, completed_at, cancelled_at")
        .single();
      if (error) throw error;
      const booking: BookingRow = {
        id: data.id as string, user_id: data.user_id as string, turf_id: data.turf_id as string,
        start_time: data.start_time as string, end_time: data.end_time as string,
        total_price: Number(data.total_price ?? 0), status: data.status as BookingRow["status"],
        lock_expires_at: data.lock_expires_at as string | null, confirmed_at: data.confirmed_at as string | null,
        completed_at: data.completed_at as string | null, cancelled_at: data.cancelled_at as string | null,
      };
      dispatch({ type: "CONFIRM_SUCCESS", booking });
      onBookingConfirmed?.(booking);
    } catch (e) {
      dispatch({ type: "CONFIRM_FAILURE", message: e instanceof Error ? e.message : "Failed to confirm." });
    }
  };

  const currentStep = getStepIndex(state.status);
  const countdownPercent = state.countdownSeconds > 0 ? (state.countdownSeconds / LOCK_DURATION_SECONDS) * 100 : 0;

  return (
    <section className="glass-panel p-5">
      <h2 className="text-lg font-semibold">Booking Flow</h2>
      <p className="mt-1 text-xs text-zinc-400">Lock → Pay → Confirm lifecycle</p>

      {/* State flow indicator */}
      <div className="mt-4 flex items-center gap-1">
        {FLOW_STEPS.map((step, i) => {
          const isActive = i === currentStep;
          const isDone = i < currentStep && currentStep >= 0;
          return (
            <div key={step.key} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                  isDone ? "bg-neon" : isActive ? "bg-neon/60 animate-pulse" : "bg-zinc-800"
                }`}
              />
              <span
                className={`text-[9px] font-medium uppercase tracking-wide transition-colors duration-300 ${
                  isDone ? "text-neon" : isActive ? "text-zinc-200" : "text-zinc-600"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Booking summary */}
      <div className="mt-4 space-y-1 text-sm text-zinc-300">
        <p>Turf: <span className="text-zinc-100 font-medium">{bookingSummary?.turf_id ?? "Not selected"}</span></p>
        <p>Start: <span className="text-zinc-100">{bookingSummary ? new Date(bookingSummary.start_time).toLocaleString() : "—"}</span></p>
        <p>End: <span className="text-zinc-100">{bookingSummary ? new Date(bookingSummary.end_time).toLocaleString() : "—"}</span></p>
      </div>

      {/* Animated countdown progress bar */}
      <AnimatePresence>
        {state.status === "LOCKED" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-300">Lock expires in</span>
              <span className="font-mono font-bold text-amber-200">{formatCountdown(state.countdownSeconds)}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <motion.div
                className={`h-full rounded-full transition-colors duration-500 ${
                  countdownPercent > 30 ? "bg-gradient-to-r from-neon to-emerald-400" : "bg-gradient-to-r from-amber-400 to-red-500"
                }`}
                initial={false}
                animate={{ width: `${countdownPercent}%` }}
                transition={{ duration: 0.8, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status message */}
      <p className={`mt-3 text-sm ${
        state.status === "ERROR" ? "text-red-400" :
        state.status === "CONFIRMED" ? "text-emerald-400" :
        state.status === "EXPIRED" ? "text-amber-400" :
        "text-zinc-300"
      }`}>
        {state.message}
      </p>

      {/* Booking details card */}
      <AnimatePresence>
        {state.booking && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-3 text-xs text-zinc-300 backdrop-blur-sm"
          >
            <p>Booking ID: <span className="text-zinc-100 font-mono">{state.booking.id.slice(0, 12)}…</span></p>
            <p>Status: <span className="font-semibold text-neon">{state.booking.status}</span></p>
            <p>Total: <span className="text-zinc-100">₹{state.booking.total_price}</span></p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="mt-5 flex flex-wrap gap-2">
        <motion.button
          type="button"
          onClick={handleLockSlot}
          disabled={!canLock}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="rounded-xl bg-neon px-4 py-2.5 text-sm font-bold text-zinc-900 shadow-glass-glow transition disabled:opacity-40 disabled:shadow-none"
        >
          {state.status === "LOCKING" ? "Locking…" : "Lock Slot (10 min)"}
        </motion.button>
        <motion.button
          type="button"
          onClick={handleConfirmPayment}
          disabled={!canConfirm}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="rounded-xl border border-zinc-600 bg-zinc-800/70 px-4 py-2.5 text-sm font-semibold text-zinc-200 backdrop-blur-sm transition disabled:opacity-40"
        >
          {state.status === "CONFIRMING" ? "Confirming…" : "Pay & Confirm"}
        </motion.button>
        <button
          type="button"
          onClick={() => dispatch({ type: "RESET" })}
          className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          Reset
        </button>
      </div>
    </section>
  );
}
