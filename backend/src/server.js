const app = require('./app');
const env = require('./config/env');
const prisma = require('./db/prisma');

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

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
