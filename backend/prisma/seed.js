const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const weeklyHours = {
  MONDAY: { open: '06:00', close: '23:00', isClosed: false },
  TUESDAY: { open: '06:00', close: '23:00', isClosed: false },
  WEDNESDAY: { open: '06:00', close: '23:00', isClosed: false },
  THURSDAY: { open: '06:00', close: '23:00', isClosed: false },
  FRIDAY: { open: '06:00', close: '23:30', isClosed: false },
  SATURDAY: { open: '05:30', close: '23:30', isClosed: false },
  SUNDAY: { open: '05:30', close: '22:30', isClosed: false }
};

async function main() {
  const [playerPasswordHash, ownerPasswordHash, adminPasswordHash] = await Promise.all([
    bcrypt.hash('Player@123', 10),
    bcrypt.hash('Owner@123', 10),
    bcrypt.hash('Admin@123', 10)
  ]);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@zevo.demo' },
    update: {
      name: 'Demo Owner',
      role: 'OWNER',
      passwordHash: ownerPasswordHash,
      walletBalance: '5000.00'
    },
    create: {
      name: 'Demo Owner',
      email: 'owner@zevo.demo',
      role: 'OWNER',
      passwordHash: ownerPasswordHash,
      walletBalance: '5000.00'
    }
  });

  await prisma.user.upsert({
    where: { email: 'player@zevo.demo' },
    update: {
      name: 'Demo Player',
      role: 'PLAYER',
      passwordHash: playerPasswordHash,
      walletBalance: '2000.00'
    },
    create: {
      name: 'Demo Player',
      email: 'player@zevo.demo',
      role: 'PLAYER',
      passwordHash: playerPasswordHash,
      walletBalance: '2000.00'
    }
  });

  await prisma.user.upsert({
    where: { email: 'admin@zevo.demo' },
    update: {
      name: 'Demo Admin',
      role: 'ADMIN',
      passwordHash: adminPasswordHash,
      walletBalance: '0.00'
    },
    create: {
      name: 'Demo Admin',
      email: 'admin@zevo.demo',
      role: 'ADMIN',
      passwordHash: adminPasswordHash,
      walletBalance: '0.00'
    }
  });

  await prisma.turf.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {
      ownerId: owner.id,
      pricePerHour: '500.00',
      location: 'Andheri West, Mumbai',
      timeZone: 'Asia/Kolkata',
      operatingHours: weeklyHours
    },
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      ownerId: owner.id,
      pricePerHour: '500.00',
      location: 'Andheri West, Mumbai',
      timeZone: 'Asia/Kolkata',
      operatingHours: weeklyHours
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed completed. Demo users and turf are ready.');
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
