const express = require('express');

const env = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const bookingRoutes = require('./routes/booking.routes');
const turfRoutes = require('./routes/turf.routes');
const { authenticateJwt } = require('./middleware/auth.middleware');
const bookingController = require('./controllers/booking.controller');
const validate = require('./middleware/validate.middleware');
const { initiateBookingSchema, availableSlotsQuerySchema } = require('./validators/booking.validator');
const errorHandler = require('./middleware/error-handler.middleware');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', env.frontendUrl);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());

app.get('/health', (req, res) => {
  return res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/turfs', turfRoutes);
app.use('/bookings', bookingRoutes);

// Backward-compatible aliases from earlier API shape.
app.get('/available-slots', validate(availableSlotsQuerySchema, 'query'), bookingController.availableSlots);
app.post('/book-turf', authenticateJwt, validate(initiateBookingSchema), bookingController.initiateBooking);

app.use(errorHandler);

module.exports = app;
