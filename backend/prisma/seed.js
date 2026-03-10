const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const playerPasswordHash = await bcrypt.hash('Player@123', 10);
  const ownerPasswordHash = await bcrypt.hash('Owner@123', 10);

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

  await prisma.turf.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {
      ownerId: owner.id,
      hourlyRate: '500.00',
      location: 'Andheri West, Mumbai',
      operatingHours: { start: '06:00', end: '23:00' }
    },
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      ownerId: owner.id,
      hourlyRate: '500.00',
      location: 'Andheri West, Mumbai',
      operatingHours: { start: '06:00', end: '23:00' }
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
