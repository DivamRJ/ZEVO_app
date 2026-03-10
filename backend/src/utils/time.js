const { BadRequestError } = require('./errors');

function parseIsoDate(value, fieldName) {
  const date = new Date(value);

  if (!value || Number.isNaN(date.getTime())) {
    throw new BadRequestError(`${fieldName} must be a valid ISO date-time.`);
  }

  return date;
}

function ensureFutureAndMinimumDuration(startTime, endTime) {
  const now = new Date();

  if (startTime <= now) {
    throw new BadRequestError('StartTime must be in the future.');
  }

  const minimumEndTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  if (endTime < minimumEndTime) {
    throw new BadRequestError('EndTime must be at least 60 minutes after StartTime.');
  }
}

function parseTimeOfDayToMinutes(value) {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) {
    throw new BadRequestError('OperatingHours time must use HH:mm format.');
  }

  const [hour, minute] = value.split(':').map(Number);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new BadRequestError('OperatingHours time is out of range.');
  }

  return hour * 60 + minute;
}

function addMinutesToUtcDate(baseDate, minutes) {
  return new Date(baseDate.getTime() + minutes * 60 * 1000);
}

module.exports = {
  parseIsoDate,
  ensureFutureAndMinimumDuration,
  parseTimeOfDayToMinutes,
  addMinutesToUtcDate
};
