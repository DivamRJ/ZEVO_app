const express = require('express');
const cors = require('cors');

const env = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const bookingRoutes = require('./routes/booking.routes');
const turfRoutes = require('./routes/turf.routes');
const prisma = require('./db/prisma');
const { authenticateJwt } = require('./middleware/auth.middleware');
const bookingController = require('./controllers/booking.controller');
const validate = require('./middleware/validate.middleware');
const { initiateBookingSchema, availableSlotsQuerySchema } = require('./validators/booking.validator');
const errorHandler = require('./middleware/error-handler.middleware');
const { registerOwnerNotificationListener } = require('./services/notification.service');

const app = express();
registerOwnerNotificationListener();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  return res.json({ status: 'ok' });
});
app.get('/api/health', (req, res) => {
  return res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/turfs', turfRoutes);
app.use('/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/turfs', turfRoutes);
app.use('/api/bookings', bookingRoutes);

// Backward-compatible aliases from earlier API shape.
app.get('/available-slots', validate(availableSlotsQuerySchema, 'query'), bookingController.availableSlots);
app.post('/book-turf', authenticateJwt, validate(initiateBookingSchema), bookingController.initiateBooking);
app.get('/api/available-slots', validate(availableSlotsQuerySchema, 'query'), bookingController.availableSlots);
app.post('/api/book-turf', authenticateJwt, validate(initiateBookingSchema), bookingController.initiateBooking);

app.use(errorHandler);

if (require.main === module) {
  const server = app.listen(env.port, () => {
    console.log(`Zevo backend running on port ${env.port}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} received. Shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

module.exports = app;
