"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";

import { confirmBookingPayment, lockBooking, type BookingApi, type TurfApi } from "@/lib/api-client";

type Slot = {
  start_time: string;
  end_time: string;
};

type FlowState = {
  status: "IDLE" | "LOCKING" | "LOCKED" | "CONFIRMING" | "CONFIRMED" | "EXPIRED" | "ERROR";
  message: string;
  booking: BookingApi | null;
  countdownSeconds: number;
};

type Action =
  | { type: "RESET" }
  | { type: "LOCK_REQUEST" }
  | { type: "LOCK_SUCCESS"; booking: BookingApi }
  | { type: "LOCK_FAILURE"; message: string }
  | { type: "TICK" }
  | { type: "EXPIRE" }
  | { type: "CONFIRM_REQUEST" }
  | { type: "CONFIRM_SUCCESS"; booking: BookingApi }
  | { type: "CONFIRM_FAILURE"; message: string };

const initialState: FlowState = {
  status: "IDLE",
  message: "Select a slot to start booking.",
  booking: null,
  countdownSeconds: 0
};

function secondsUntil(isoDate: string | null) {
  if (!isoDate) return 0;
  const diff = Math.floor((new Date(isoDate).getTime() - Date.now()) / 1000);
  return Math.max(diff, 0);
}

function reducer(state: FlowState, action: Action): FlowState {
  switch (action.type) {
    case "RESET":
      return initialState;
    case "LOCK_REQUEST":
      return {
        ...state,
        status: "LOCKING",
        message: "Locking slot for 10 minutes...",
        booking: null,
        countdownSeconds: 0
      };
    case "LOCK_SUCCESS":
      return {
        ...state,
        status: "LOCKED",
        message: "Slot locked. Complete payment before timer ends.",
        booking: action.booking,
        countdownSeconds: secondsUntil(action.booking.lock_expires_at)
      };
    case "LOCK_FAILURE":
      return {
        ...state,
        status: "ERROR",
        message: action.message,
        booking: null,
        countdownSeconds: 0
      };
    case "TICK": {
      const nextSeconds = Math.max(state.countdownSeconds - 1, 0);
      return {
        ...state,
        countdownSeconds: nextSeconds,
        status: nextSeconds === 0 && state.status === "LOCKED" ? "EXPIRED" : state.status,
        message:
          nextSeconds === 0 && state.status === "LOCKED"
            ? "Lock expired. Select the slot again."
            : state.message
      };
    }
    case "EXPIRE":
      return {
        ...state,
        status: "EXPIRED",
        message: "Lock expired. Select the slot again.",
        booking: null,
        countdownSeconds: 0
      };
    case "CONFIRM_REQUEST":
      return {
        ...state,
        status: "CONFIRMING",
        message: "Confirming payment..."
      };
    case "CONFIRM_SUCCESS":
      return {
        ...state,
        status: "CONFIRMED",
        message: "Payment successful. Booking confirmed.",
        booking: action.booking,
        countdownSeconds: 0
      };
    case "CONFIRM_FAILURE":
      return {
        ...state,
        status: "ERROR",
        message: action.message
      };
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
  const now = Date.now();

  if (start.getTime() <= now) {
    return "Start time must be in the future.";
  }

  const durationMs = end.getTime() - start.getTime();

  if (durationMs < 60 * 60 * 1000) {
    return "Minimum booking duration is 1 hour.";
  }

  return null;
}

type BookingFormProps = {
  selectedTurf: TurfApi | null;
  selectedSlot: Slot | null;
  onBookingConfirmed?: (booking: BookingApi) => void;
};

export function BookingForm({ selectedTurf, selectedSlot, onBookingConfirmed }: BookingFormProps) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.status !== "LOCKED") return;

    const timer = window.setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [state.status]);

  useEffect(() => {
    if (state.status === "EXPIRED") {
      dispatch({ type: "EXPIRE" });
    }
  }, [state.status]);

  const canLock = Boolean(selectedTurf && selectedSlot) && state.status !== "LOCKING";
  const canConfirm = state.status === "LOCKED" && !!state.booking;

  const bookingSummary = useMemo(() => {
    if (!selectedTurf || !selectedSlot) return null;

    return {
      turf_id: selectedTurf.turf_id,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time
    };
  }, [selectedTurf, selectedSlot]);

  const requestLock = useCallback(async (turf: TurfApi, slot: Slot) => {
    const validationError = validateSlot(slot);

    if (validationError) {
      dispatch({ type: "LOCK_FAILURE", message: validationError });
      return;
    }

    dispatch({ type: "LOCK_REQUEST" });

    try {
      const response = await lockBooking({
        turf_id: turf.turf_id,
        start_time: slot.start_time,
        end_time: slot.end_time
      });

      dispatch({ type: "LOCK_SUCCESS", booking: response.booking });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to lock slot.";
      dispatch({ type: "LOCK_FAILURE", message });
    }
  }, []);

  useEffect(() => {
    if (!selectedTurf || !selectedSlot) return;

    // Requirement sync: lock is triggered as soon as user selects a slot.
    void requestLock(selectedTurf, selectedSlot);
  }, [selectedTurf?.turf_id, selectedSlot?.start_time, selectedSlot?.end_time, requestLock]);

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
      const response = await confirmBookingPayment({
        booking_id: state.booking.booking_id
      });

      dispatch({ type: "CONFIRM_SUCCESS", booking: response.booking });
      onBookingConfirmed?.(response.booking);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to confirm payment.";
      dispatch({ type: "CONFIRM_FAILURE", message });
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
      <h2 className="text-lg font-semibold">Booking Form</h2>
      <p className="mt-1 text-xs text-zinc-400">Payload uses backend keys: `turf_id`, `start_time`, `end_time`.</p>

      <div className="mt-3 space-y-1 text-sm text-zinc-300">
        <p>Turf: {bookingSummary?.turf_id ?? "Not selected"}</p>
        <p>Start: {bookingSummary ? new Date(bookingSummary.start_time).toISOString() : "Not selected"}</p>
        <p>End: {bookingSummary ? new Date(bookingSummary.end_time).toISOString() : "Not selected"}</p>
      </div>

      {state.status === "LOCKED" ? (
        <p className="mt-3 text-sm font-semibold text-amber-300">Lock expires in: {formatCountdown(state.countdownSeconds)}</p>
      ) : null}

      <p className="mt-3 text-sm text-zinc-300">{state.message}</p>

      {state.booking ? (
        <div className="mt-3 rounded-xl border border-zinc-700 bg-zinc-800/80 p-3 text-xs text-zinc-300">
          <p>Booking ID: {state.booking.booking_id}</p>
          <p>Status: {state.booking.status}</p>
          <p>Total Price: Rs. {state.booking.total_price}</p>
          <p>Lock Expires: {state.booking.lock_expires_at ?? "N/A"}</p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleLockSlot}
          disabled={!canLock}
          className="rounded-xl bg-neon px-4 py-2 text-sm font-bold text-zinc-900 disabled:opacity-50"
        >
          {state.status === "LOCKING" ? "Locking..." : "Lock Slot (10 min)"}
        </button>
        <button
          type="button"
          onClick={handleConfirmPayment}
          disabled={!canConfirm}
          className="rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 disabled:opacity-50"
        >
          {state.status === "CONFIRMING" ? "Confirming..." : "Pay & Confirm"}
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "RESET" })}
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300"
        >
          Reset Flow
        </button>
      </div>
    </section>
  );
}
