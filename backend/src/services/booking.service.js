const { Prisma } = require('@prisma/client');
const prisma = require('../db/prisma');
const {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InsufficientFundsError,
  NotFoundError
} = require('../utils/errors');
const {
  parseIsoDate,
  ensureFutureAndMinimumDuration,
  parseTimeOfDayToMinutes,
  addMinutesToUtcDate
} = require('../utils/time');

function calculateTotalPrice(hourlyRate, startTime, endTime) {
  const durationHours = (endTime.getTime() - startTime.getTime()) / (60 * 60 * 1000);
  const total = Number(hourlyRate) * durationHours;
  return Number(total.toFixed(2));
}

function getOperatingWindowForDate(operatingHours, dateAnchor) {
  if (
    !operatingHours ||
    typeof operatingHours !== 'object' ||
    typeof operatingHours.start !== 'string' ||
    typeof operatingHours.end !== 'string'
  ) {
    throw new BadRequestError('Turf operating hours are not configured correctly.');
  }

  const startMinutes = parseTimeOfDayToMinutes(operatingHours.start);
  const endMinutes = parseTimeOfDayToMinutes(operatingHours.end);

  if (endMinutes <= startMinutes) {
    throw new BadRequestError('OperatingHours end must be after start.');
  }

  const dayStart = new Date(
    Date.UTC(dateAnchor.getUTCFullYear(), dateAnchor.getUTCMonth(), dateAnchor.getUTCDate())
  );

  return {
    operatingStartTime: addMinutesToUtcDate(dayStart, startMinutes),
    operatingEndTime: addMinutesToUtcDate(dayStart, endMinutes)
  };
}

function ensureBookingWithinOperatingHours(turf, startTime, endTime) {
  const startsAndEndsSameDay =
    startTime.getUTCFullYear() === endTime.getUTCFullYear() &&
    startTime.getUTCMonth() === endTime.getUTCMonth() &&
    startTime.getUTCDate() === endTime.getUTCDate();

  if (!startsAndEndsSameDay) {
    throw new BadRequestError('Booking must start and end on the same UTC date.');
  }

  const { operatingStartTime, operatingEndTime } = getOperatingWindowForDate(
    turf.operatingHours,
    startTime
  );

  if (startTime < operatingStartTime || endTime > operatingEndTime) {
    throw new BadRequestError('Booking must be within turf operating hours.');
  }
}

async function createBooking({ userId, turfId, startTime, endTime }) {
  const parsedStartTime = parseIsoDate(startTime, 'StartTime');
  const parsedEndTime = parseIsoDate(endTime, 'EndTime');

  ensureFutureAndMinimumDuration(parsedStartTime, parsedEndTime);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const booking = await prisma.$transaction(
        async (tx) => {
          const [user, turf] = await Promise.all([
            tx.user.findUnique({ where: { id: userId } }),
            tx.turf.findUnique({ where: { id: turfId } })
          ]);

          if (!user) {
            throw new NotFoundError('User not found.');
          }

          if (!turf) {
            throw new NotFoundError('Turf not found.');
          }

          ensureBookingWithinOperatingHours(turf, parsedStartTime, parsedEndTime);

          if (user.role === 'OWNER' && turf.ownerId === user.id) {
            const overlappingPlayerBooking = await tx.booking.findFirst({
              where: {
                turfId,
                status: 'CONFIRMED',
                startTime: { lt: parsedEndTime },
                endTime: { gt: parsedStartTime },
                user: {
                  role: 'PLAYER'
                }
              }
            });

            if (overlappingPlayerBooking) {
              throw new ForbiddenError(
                'Owner cannot book this slot because a player has already reserved it.'
              );
            }
          }

          const overlappingBooking = await tx.booking.findFirst({
            where: {
              turfId,
              status: {
                in: ['PENDING', 'CONFIRMED']
              },
              startTime: { lt: parsedEndTime },
              endTime: { gt: parsedStartTime }
            }
          });

          if (overlappingBooking) {
            throw new ConflictError('Selected slot is already booked.');
          }

          const totalPrice = calculateTotalPrice(turf.hourlyRate, parsedStartTime, parsedEndTime);

          if (Number(user.walletBalance) < totalPrice) {
            throw new InsufficientFundsError('Insufficient funds in wallet.');
          }

          await tx.user.update({
            where: { id: user.id },
            data: {
              walletBalance: {
                decrement: totalPrice
              }
            }
          });

          return tx.booking.create({
            data: {
              userId: user.id,
              turfId: turf.id,
              startTime: parsedStartTime,
              endTime: parsedEndTime,
              totalPrice,
              status: 'CONFIRMED'
            }
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        }
      );

      return {
        id: booking.id,
        userId: booking.userId,
        turfId: booking.turfId,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        totalPrice: Number(booking.totalPrice),
        status: booking.status
      };
    } catch (error) {
      const isSerializationFailure =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';

      if (isSerializationFailure && attempt < 2) {
        continue;
      }

      throw error;
    }
  }

  throw new Error('Failed to create booking after retries.');
}

async function getAvailableSlots({ turfId, date }) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new BadRequestError('Date must be in YYYY-MM-DD format.');
  }

  const dayStart = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(dayStart.getTime())) {
    throw new BadRequestError('Date is invalid.');
  }

  const turf = await prisma.turf.findUnique({ where: { id: turfId } });

  if (!turf) {
    throw new NotFoundError('Turf not found.');
  }

  const { operatingStartTime, operatingEndTime } = getOperatingWindowForDate(
    turf.operatingHours,
    dayStart
  );

  const confirmedBookings = await prisma.booking.findMany({
    where: {
      turfId,
      status: 'CONFIRMED',
      startTime: { lt: operatingEndTime },
      endTime: { gt: operatingStartTime }
    },
    select: {
      startTime: true,
      endTime: true
    }
  });

  const availableSlots = [];

  for (
    let slotStartTime = new Date(operatingStartTime);
    slotStartTime < operatingEndTime;
    slotStartTime = new Date(slotStartTime.getTime() + 60 * 60 * 1000)
  ) {
    const slotEndTime = new Date(slotStartTime.getTime() + 60 * 60 * 1000);

    if (slotEndTime > operatingEndTime) {
      break;
    }

    const isOccupied = confirmedBookings.some(
      (booking) => booking.startTime < slotEndTime && booking.endTime > slotStartTime
    );

    if (!isOccupied) {
      availableSlots.push({
        startTime: slotStartTime.toISOString(),
        endTime: slotEndTime.toISOString()
      });
    }
  }

  return availableSlots;
}

module.exports = {
  createBooking,
  getAvailableSlots
};
