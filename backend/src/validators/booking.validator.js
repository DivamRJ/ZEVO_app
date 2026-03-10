const { z } = require('zod');

const isoDateTimeSchema = z
  .string()
  .refine((value) => /(Z|[+-]\d{2}:\d{2})$/.test(value), {
    message: 'must be ISO 8601 with timezone information.'
  });

const initiateBookingSchema = z.object({
  turf_id: z.string().uuid(),
  start_time: isoDateTimeSchema,
  end_time: isoDateTimeSchema
});

const confirmPaymentParamsSchema = z.object({
  booking_id: z.string().uuid()
});

const bookingActionParamsSchema = z.object({
  booking_id: z.string().uuid()
});

const availableSlotsQuerySchema = z.object({
  turf_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  slot_minutes: z.coerce.number().int().min(30).max(180).optional(),
  slotMinutes: z.coerce.number().int().min(30).max(180).optional()
});

module.exports = {
  initiateBookingSchema,
  confirmPaymentParamsSchema,
  bookingActionParamsSchema,
  availableSlotsQuerySchema
};
