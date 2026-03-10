const prisma = require('../db/prisma');

function create(data, tx = prisma) {
  return tx.booking.create({ data });
}

function findById(id, tx = prisma) {
  return tx.booking.findUnique({ where: { id } });
}

function findByIdWithRelations(id, tx = prisma) {
  return tx.booking.findUnique({
    where: { id },
    include: {
      turf: {
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      },
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          walletBalance: true
        }
      }
    }
  });
}

function update(id, data, tx = prisma) {
  return tx.booking.update({ where: { id }, data });
}

function cancelExpiredPendingForTurf(turfId, now, tx = prisma) {
  return tx.booking.updateMany({
    where: {
      turfId,
      status: 'PENDING',
      lockExpiresAt: {
        lte: now
      }
    },
    data: {
      status: 'CANCELLED',
      cancelledAt: now
    }
  });
}

function findOverlappingActiveForTurf({ turfId, startTime, endTime, now, excludeBookingId }, tx = prisma) {
  return tx.booking.findFirst({
    where: {
      turfId,
      id: excludeBookingId
        ? {
            not: excludeBookingId
          }
        : undefined,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      OR: [
        { status: 'CONFIRMED' },
        {
          status: 'PENDING',
          lockExpiresAt: { gt: now }
        }
      ]
    }
  });
}

function findUserConfirmedOverlap({ userId, startTime, endTime, excludeBookingId }, tx = prisma) {
  return tx.booking.findFirst({
    where: {
      userId,
      status: 'CONFIRMED',
      id: excludeBookingId
        ? {
            not: excludeBookingId
          }
        : undefined,
      startTime: { lt: endTime },
      endTime: { gt: startTime }
    }
  });
}

function findActiveBookingsForWindow({ turfId, windowStart, windowEnd, now }, tx = prisma) {
  return tx.booking.findMany({
    where: {
      turfId,
      startTime: { lt: windowEnd },
      endTime: { gt: windowStart },
      OR: [
        { status: 'CONFIRMED' },
        {
          status: 'PENDING',
          lockExpiresAt: { gt: now }
        }
      ]
    },
    select: {
      id: true,
      status: true,
      startTime: true,
      endTime: true,
      lockExpiresAt: true
    }
  });
}

function findActiveByUser({ userId, now }, tx = prisma) {
  return tx.booking.findMany({
    where: {
      userId,
      OR: [
        { status: 'CONFIRMED' },
        {
          status: 'PENDING',
          lockExpiresAt: { gt: now }
        }
      ]
    },
    orderBy: {
      startTime: 'asc'
    }
  });
}

module.exports = {
  create,
  findById,
  findByIdWithRelations,
  update,
  cancelExpiredPendingForTurf,
  findOverlappingActiveForTurf,
  findUserConfirmedOverlap,
  findActiveBookingsForWindow,
  findActiveByUser
};
