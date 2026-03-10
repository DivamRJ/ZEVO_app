const express = require('express');
const authenticateJwt = require('../middleware/auth');
const { createBooking, getAvailableSlots } = require('../services/booking.service');
const { BadRequestError } = require('../utils/errors');

const router = express.Router();

router.post('/book-turf', authenticateJwt, async (req, res, next) => {
  try {
    const { turfId, startTime, endTime } = req.body;

    if (!turfId || !startTime || !endTime) {
      throw new BadRequestError('turfId, startTime, and endTime are required.');
    }

    const booking = await createBooking({
      userId: req.user.id,
      turfId,
      startTime,
      endTime
    });

    return res.status(201).json({ booking });
  } catch (error) {
    return next(error);
  }
});

router.get('/available-slots', async (req, res, next) => {
  try {
    const { turfId, date } = req.query;

    if (!turfId || !date) {
      throw new BadRequestError('turfId and date are required query params.');
    }

    const slots = await getAvailableSlots({
      turfId: String(turfId),
      date: String(date)
    });

    return res.json({
      turfId,
      date,
      slots
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
