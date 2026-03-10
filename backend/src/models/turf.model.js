const prisma = require('../db/prisma');

function findById(id, tx = prisma) {
  return tx.turf.findUnique({ where: { id } });
}

function findByIdWithOwner(id, tx = prisma) {
  return tx.turf.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });
}

function listAll(tx = prisma) {
  return tx.turf.findMany({
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

module.exports = {
  findById,
  findByIdWithOwner,
  listAll
};
