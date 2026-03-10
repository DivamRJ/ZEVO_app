const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db/prisma');
const env = require('../config/env');
const { BadRequestError, UnauthorizedError } = require('../utils/errors');

async function login({ email, password }) {
  if (!email || !password) {
    throw new BadRequestError('Email and password are required.');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const matches = await bcrypt.compare(password, user.passwordHash);

  if (!matches) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const token = jwt.sign(
    {
      role: user.role
    },
    env.jwtSecret,
    {
      subject: user.id,
      expiresIn: '8h'
    }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      walletBalance: Number(user.walletBalance)
    }
  };
}

module.exports = {
  login
};
