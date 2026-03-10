const dotenv = require('dotenv');

dotenv.config();

const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'replace-with-strong-secret',
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, ''),
  ownerNotificationWebhookUrl: process.env.OWNER_NOTIFICATION_WEBHOOK_URL || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  zevoFromEmail: process.env.ZEVO_FROM_EMAIL || 'ZEVO <onboarding@resend.dev>',
  zevoBookingsEmail: process.env.ZEVO_BOOKINGS_EMAIL || ''
};

if (!env.databaseUrl) {
  throw new Error('Missing DATABASE_URL in environment variables.');
}

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Using an insecure fallback secret.');
}

module.exports = env;
