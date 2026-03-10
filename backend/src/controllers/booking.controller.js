const bookingCoordinator = require('../services/booking-coordinator.service');

async function initiateBooking(req, res, next) {
  try {
    const booking = await bookingCoordinator.initiateBooking({
      userId: req.user.id,
      turfId: req.body.turf_id,
      startTime: req.body.start_time,
      endTime: req.body.end_time
    });

    return res.status(201).json({
      message: 'Booking created with 10-minute lock. Confirm payment before lock expires.',
      booking
    });
  } catch (error) {
    return next(error);
  }
}

async function confirmPayment(req, res, next) {
  try {
    const booking = await bookingCoordinator.confirmPayment({
      bookingId: req.params.booking_id,
      actor: req.user
    });

    return res.json({
      message: 'Payment confirmed and booking is now CONFIRMED.',
      booking
    });
  } catch (error) {
    return next(error);
  }
}

async function completeBooking(req, res, next) {
  try {
    const booking = await bookingCoordinator.completeBooking({
      bookingId: req.params.booking_id,
      actor: req.user
    });

    return res.json({
      message: 'Booking marked as COMPLETED.',
      booking
    });
  } catch (error) {
    return next(error);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const booking = await bookingCoordinator.cancelBooking({
      bookingId: req.params.booking_id,
      actor: req.user
    });

    return res.json({
      message: 'Booking cancelled.',
      booking
    });
  } catch (error) {
    return next(error);
  }
}

async function availableSlots(req, res, next) {
  try {
    const payload = await bookingCoordinator.getAvailableSlots({
      turfId: req.query.turf_id,
      date: req.query.date,
      slotMinutes: req.query.slot_minutes || req.query.slotMinutes || 60
    });

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
}

async function activeBookings(req, res, next) {
  try {
    const bookings = await bookingCoordinator.getActiveBookings({
      userId: req.user.id
    });

    return res.json({ bookings });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  initiateBooking,
  confirmPayment,
  completeBooking,
  cancelBooking,
  availableSlots,
  activeBookings
};
