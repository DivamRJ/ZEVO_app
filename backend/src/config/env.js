const dotenv = require('dotenv');

dotenv.config();

const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'replace-with-strong-secret',
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  ownerNotificationWebhookUrl: process.env.OWNER_NOTIFICATION_WEBHOOK_URL || ''
};

if (!env.databaseUrl) {
  throw new Error('Missing DATABASE_URL in environment variables.');
}

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Using an insecure fallback secret.');
}

module.exports = env;
