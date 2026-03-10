const { DateTime } = require('luxon');
const { ValidationError } = require('./errors');

const DAY_KEYS = {
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
  7: 'SUNDAY'
};

function isIso8601WithOffset(value) {
  return typeof value === 'string' && /(Z|[+-]\d{2}:\d{2})$/.test(value);
}

function parseUtcIso(value, fieldName) {
  if (!isIso8601WithOffset(value)) {
    throw new ValidationError(`${fieldName} must be an ISO 8601 string with timezone (e.g., 2026-03-10T10:00:00Z).`);
  }

  const dt = DateTime.fromISO(value, { setZone: true }).toUTC();

  if (!dt.isValid) {
    throw new ValidationError(`${fieldName} must be a valid ISO 8601 datetime.`);
  }

  return dt;
}

function parseHHmm(value, fieldName) {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) {
    throw new ValidationError(`${fieldName} must be in HH:mm format.`);
  }

  const [hour, minute] = value.split(':').map(Number);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new ValidationError(`${fieldName} has out-of-range time.`);
  }

  return hour * 60 + minute;
}

function getLocalOperatingWindow(operatingHours, timeZone, localDate) {
  const dayKey = DAY_KEYS[localDate.weekday];
  const dayConfig = operatingHours?.[dayKey];

  if (!dayConfig || dayConfig.isClosed) {
    return null;
  }

  const openMinutes = parseHHmm(dayConfig.open, `${dayKey}.open`);
  const closeMinutes = parseHHmm(dayConfig.close, `${dayKey}.close`);

  const openLocal = localDate.startOf('day').plus({ minutes: openMinutes });
  let closeLocal = localDate.startOf('day').plus({ minutes: closeMinutes });

  // Supports overnight windows (e.g., 18:00 -> 02:00 next day).
  if (closeMinutes <= openMinutes) {
    closeLocal = closeLocal.plus({ days: 1 });
  }

  return {
    dayKey,
    openLocal,
    closeLocal,
    openUtc: openLocal.toUTC(),
    closeUtc: closeLocal.toUTC()
  };
}

function ensureFutureAndMinimumDuration(startUtc, endUtc, minimumMinutes = 60) {
  const now = DateTime.utc();

  if (startUtc <= now) {
    throw new ValidationError('StartTime must be in the future.');
  }

  const minimumEnd = startUtc.plus({ minutes: minimumMinutes });

  if (endUtc < minimumEnd) {
    throw new ValidationError(`EndTime must be at least ${minimumMinutes} minutes after StartTime.`);
  }
}

function ensureWithinOperatingHours(turf, startUtc, endUtc) {
  const zone = turf.timeZone || 'UTC';
  const startLocal = startUtc.setZone(zone);

  const candidateDates = [startLocal.startOf('day'), startLocal.minus({ days: 1 }).startOf('day')];

  const isValid = candidateDates.some((localDate) => {
    const window = getLocalOperatingWindow(turf.operatingHours, zone, localDate);
    if (!window) return false;
    return startUtc >= window.openUtc && endUtc <= window.closeUtc;
  });

  if (!isValid) {
    throw new ValidationError('Requested slot is outside turf operating hours.');
  }
}

function getOperatingWindowForLocalDate(turf, dateString) {
  const zone = turf.timeZone || 'UTC';
  const localDate = DateTime.fromISO(dateString, { zone });

  if (!localDate.isValid) {
    throw new ValidationError('date must be in YYYY-MM-DD format.');
  }

  const window = getLocalOperatingWindow(turf.operatingHours, zone, localDate.startOf('day'));

  if (!window) {
    return null;
  }

  return window;
}

function toUtcDate(dt) {
  return dt.toUTC().toJSDate();
}

module.exports = {
  parseUtcIso,
  ensureFutureAndMinimumDuration,
  ensureWithinOperatingHours,
  getOperatingWindowForLocalDate,
  toUtcDate
};
