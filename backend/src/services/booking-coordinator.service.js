const { Prisma } = require('@prisma/client');
const { DateTime } = require('luxon');

const prisma = require('../db/prisma');
const bookingModel = require('../models/booking.model');
const turfModel = require('../models/turf.model');
const userModel = require('../models/user.model');
const { emitBookingConfirmed } = require('./notification.service');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  InsufficientFundsError
} = require('../utils/errors');
const {
  parseUtcIso,
  ensureFutureAndMinimumDuration,
  ensureWithinOperatingHours,
  getOperatingWindowForLocalDate,
  toUtcDate
} = require('../utils/time');

const SLOT_LOCK_MINUTES = 10;
const MIN_BOOKING_MINUTES = 60;

function calculateTotalPrice(pricePerHour, startUtc, endUtc) {
  const durationHours = endUtc.diff(startUtc, 'minutes').minutes / 60;
  const total = Number(pricePerHour) * durationHours;
  return Number(total.toFixed(2));
}

function serializeBooking(booking) {
  return {
    booking_id: booking.id,
    user_id: booking.userId,
    turf_id: booking.turfId,
    start_time: booking.startTime.toISOString(),
    end_time: booking.endTime.toISOString(),
    total_price: Number(booking.totalPrice),
    status: booking.status,
    lock_expires_at: booking.lockExpiresAt ? booking.lockExpiresAt.toISOString() : null,
    confirmed_at: booking.confirmedAt ? booking.confirmedAt.toISOString() : null,
    completed_at: booking.completedAt ? booking.completedAt.toISOString() : null,
    cancelled_at: booking.cancelledAt ? booking.cancelledAt.toISOString() : null
  };
}

async function withSerializableRetry(work) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      });
    } catch (error) {
      const retryableSerializationError =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';

      if (retryableSerializationError && attempt < 2) {
        continue;
      }

      throw error;
    }
  }

  throw new Error('Transaction failed after maximum retries.');
}

async function initiateBooking({ userId, turfId, startTime, endTime }) {
  const startUtc = parseUtcIso(startTime, 'startTime');
  const endUtc = parseUtcIso(endTime, 'endTime');

  ensureFutureAndMinimumDuration(startUtc, endUtc, MIN_BOOKING_MINUTES);

  const booking = await withSerializableRetry(async (tx) => {
    const now = new Date();

    const [user, turf] = await Promise.all([userModel.findById(userId, tx), turfModel.findById(turfId, tx)]);

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    if (!turf) {
      throw new NotFoundError('Turf not found.');
    }

    ensureWithinOperatingHours(turf, startUtc, endUtc);

    await bookingModel.cancelExpiredPendingForTurf(turf.id, now, tx);

    const userConflict = await bookingModel.findUserConfirmedOverlap(
      {
        userId: user.id,
        startTime: toUtcDate(startUtc),
        endTime: toUtcDate(endUtc)
      },
      tx
    );

    if (userConflict) {
      throw new ConflictError('You already have a confirmed booking during this time slot.');
    }

    const turfConflict = await bookingModel.findOverlappingActiveForTurf(
      {
        turfId: turf.id,
        startTime: toUtcDate(startUtc),
        endTime: toUtcDate(endUtc),
        now
      },
      tx
    );

    if (turfConflict) {
      throw new ConflictError('This slot is currently locked or already booked.');
    }

    const totalPrice = calculateTotalPrice(turf.pricePerHour, startUtc, endUtc);
    const lockExpiresAt = DateTime.utc().plus({ minutes: SLOT_LOCK_MINUTES }).toJSDate();

    return bookingModel.create(
      {
        userId: user.id,
        turfId: turf.id,
        startTime: toUtcDate(startUtc),
        endTime: toUtcDate(endUtc),
        totalPrice,
        status: 'PENDING',
        lockExpiresAt
      },
      tx
    );
  });

  return serializeBooking(booking);
}

async function confirmPayment({ bookingId, actor }) {
  const outcome = await withSerializableRetry(async (tx) => {
    const now = new Date();

    const booking = await bookingModel.findByIdWithRelations(bookingId, tx);

    if (!booking) {
      throw new NotFoundError('Booking not found.');
    }

    const actorIsAdmin = actor.role === 'ADMIN';
    const actorOwnsBooking = booking.userId === actor.id;

    if (!actorIsAdmin && !actorOwnsBooking) {
      throw new ForbiddenError('Only booking owner or admin can confirm payment.');
    }

    if (booking.status !== 'PENDING') {
      throw new ConflictError('Only PENDING bookings can be confirmed.');
    }

    if (!booking.lockExpiresAt || booking.lockExpiresAt <= now) {
      await bookingModel.update(
        booking.id,
        {
          status: 'CANCELLED',
          cancelledAt: now,
          lockExpiresAt: null
        },
        tx
      );

      throw new ConflictError('Booking lock expired after 10 minutes. Please create a new booking.');
    }

    const userConflict = await bookingModel.findUserConfirmedOverlap(
      {
        userId: booking.userId,
        startTime: booking.startTime,
        endTime: booking.endTime,
        excludeBookingId: booking.id
      },
      tx
    );

    if (userConflict) {
      throw new ConflictError('User already has another confirmed booking for this time.');
    }

    const turfConflict = await bookingModel.findOverlappingActiveForTurf(
      {
        turfId: booking.turfId,
        startTime: booking.startTime,
        endTime: booking.endTime,
        now,
        excludeBookingId: booking.id
      },
      tx
    );

    if (turfConflict) {
      throw new ConflictError('Slot is no longer available. Another active booking overlaps this slot.');
    }

    const userBalance = Number(booking.user.walletBalance);
    const totalPrice = Number(booking.totalPrice);

    if (userBalance < totalPrice) {
      throw new InsufficientFundsError('Insufficient wallet balance for this booking.');
    }

    await userModel.decrementWallet(booking.user.id, totalPrice, tx);

    const confirmedBooking = await bookingModel.update(
      booking.id,
      {
        status: 'CONFIRMED',
        confirmedAt: now,
        lockExpiresAt: null
      },
      tx
    );

    return {
      booking: confirmedBooking,
      owner: booking.turf.owner,
      user: booking.user,
      turf: booking.turf
    };
  });

  emitBookingConfirmed({
    bookingId: outcome.booking.id,
    ownerId: outcome.owner.id,
    ownerEmail: outcome.owner.email,
    ownerName: outcome.owner.name,
    turfId: outcome.turf.id,
    turfName: outcome.turf.name,
    turfLocation: outcome.turf.location,
    userId: outcome.user.id,
    userEmail: outcome.user.email,
    startTime: outcome.booking.startTime.toISOString(),
    endTime: outcome.booking.endTime.toISOString(),
    totalPrice: Number(outcome.booking.totalPrice)
  });

  return serializeBooking(outcome.booking);
}

async function completeBooking({ bookingId, actor }) {
  return withSerializableRetry(async (tx) => {
    const now = new Date();
    const booking = await bookingModel.findByIdWithRelations(bookingId, tx);

    if (!booking) {
      throw new NotFoundError('Booking not found.');
    }

    const canComplete = actor.role === 'ADMIN' || booking.turf.ownerId === actor.id;

    if (!canComplete) {
      throw new ForbiddenError('Only turf owner or admin can complete a booking.');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new ConflictError('Only CONFIRMED bookings can be completed.');
    }

    if (booking.endTime > now) {
      throw new ValidationError('Booking cannot be completed before endTime.');
    }

    const completed = await bookingModel.update(
      booking.id,
      {
        status: 'COMPLETED',
        completedAt: now
      },
      tx
    );

    return serializeBooking(completed);
  });
}

async function cancelBooking({ bookingId, actor }) {
  return withSerializableRetry(async (tx) => {
    const now = new Date();
    const booking = await bookingModel.findByIdWithRelations(bookingId, tx);

    if (!booking) {
      throw new NotFoundError('Booking not found.');
    }

    const canCancel =
      actor.role === 'ADMIN' || booking.userId === actor.id || booking.turf.ownerId === actor.id;

    if (!canCancel) {
      throw new ForbiddenError('You do not have permission to cancel this booking.');
    }

    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      throw new ConflictError(`Booking is already ${booking.status}.`);
    }

    const cancelled = await bookingModel.update(
      booking.id,
      {
        status: 'CANCELLED',
        cancelledAt: now,
        lockExpiresAt: null
      },
      tx
    );

    return serializeBooking(cancelled);
  });
}

async function getAvailableSlots({ turfId, date, slotMinutes = 60 }) {
  const turf = await turfModel.findById(turfId);

  if (!turf) {
    throw new NotFoundError('Turf not found.');
  }

  const operatingWindow = getOperatingWindowForLocalDate(turf, date);

  if (!operatingWindow) {
    return {
      turf_id: turfId,
      date,
      time_zone: turf.timeZone,
      slots: []
    };
  }

  const now = new Date();
  const activeBookings = await bookingModel.findActiveBookingsForWindow({
    turfId,
    windowStart: operatingWindow.openUtc.toJSDate(),
    windowEnd: operatingWindow.closeUtc.toJSDate(),
    now
  });

  const slots = [];
  let cursor = operatingWindow.openUtc;

  while (cursor.plus({ minutes: slotMinutes }) <= operatingWindow.closeUtc) {
    const slotStart = cursor;
    const slotEnd = cursor.plus({ minutes: slotMinutes });

    const occupied = activeBookings.some((booking) => {
      const bookingStart = DateTime.fromJSDate(booking.startTime, { zone: 'utc' });
      const bookingEnd = DateTime.fromJSDate(booking.endTime, { zone: 'utc' });
      return bookingStart < slotEnd && bookingEnd > slotStart;
    });

    if (!occupied) {
      slots.push({
        start_time: slotStart.toISO(),
        end_time: slotEnd.toISO()
      });
    }

    cursor = slotEnd;
  }

  return {
    turf_id: turfId,
    date,
    time_zone: turf.timeZone,
    slots
  };
}

async function getActiveBookings({ userId }) {
  const now = new Date();
  const bookings = await bookingModel.findActiveByUser({ userId, now });
  return bookings.map(serializeBooking);
}

module.exports = {
  initiateBooking,
  confirmPayment,
  completeBooking,
  cancelBooking,
  getAvailableSlots,
  getActiveBookings
};
