const prisma = require('../db/prisma');

function findById(id, tx = prisma) {
  return tx.user.findUnique({ where: { id } });
}

function findByEmail(email, tx = prisma) {
  return tx.user.findUnique({ where: { email } });
}

function create(data, tx = prisma) {
  return tx.user.create({ data });
}

function decrementWallet(userId, amount, tx = prisma) {
  return tx.user.update({
    where: { id: userId },
    data: {
      walletBalance: {
        decrement: amount
      }
    }
  });
}

module.exports = {
  findById,
  findByEmail,
  create,
  decrementWallet
};
