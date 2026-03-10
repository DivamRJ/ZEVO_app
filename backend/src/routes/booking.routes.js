const express = require('express');

const bookingController = require('../controllers/booking.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  initiateBookingSchema,
  confirmPaymentParamsSchema,
  bookingActionParamsSchema,
  availableSlotsQuerySchema
} = require('../validators/booking.validator');

const router = express.Router();

router.get('/available-slots', validate(availableSlotsQuerySchema, 'query'), bookingController.availableSlots);

router.post('/lock', authenticateJwt, validate(initiateBookingSchema), bookingController.initiateBooking);
router.post('/initiate', authenticateJwt, validate(initiateBookingSchema), bookingController.initiateBooking);
router.post(
  '/:booking_id/confirm-payment',
  authenticateJwt,
  validate(confirmPaymentParamsSchema, 'params'),
  bookingController.confirmPayment
);
router.post(
  '/:booking_id/complete',
  authenticateJwt,
  validate(bookingActionParamsSchema, 'params'),
  bookingController.completeBooking
);
router.post(
  '/:booking_id/cancel',
  authenticateJwt,
  validate(bookingActionParamsSchema, 'params'),
  bookingController.cancelBooking
);

module.exports = router;
