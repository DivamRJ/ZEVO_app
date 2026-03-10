const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const env = require('../config/env');
const userModel = require('../models/user.model');
const {
  ValidationError,
  ConflictError,
  NotFoundError,
  UnauthorizedError
} = require('../utils/errors');

function signToken(user) {
  return jwt.sign(
    {
      role: user.role
    },
    env.jwtSecret,
    {
      subject: user.id,
      expiresIn: '8h'
    }
  );
}

function toAuthResponse(user) {
  return {
    token: signToken(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      walletBalance: Number(user.walletBalance)
    }
  };
}

async function signup({ name, email, password, role }) {
  if (!name || !email || !password) {
    throw new ValidationError('Name, email, and password are required.');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedName = String(name).trim();

  if (!normalizedName) {
    throw new ValidationError('Name is required.');
  }

  if (String(password).length < 8) {
    throw new ValidationError('Password must be at least 8 characters long.');
  }

  const existing = await userModel.findByEmail(normalizedEmail);

  if (existing) {
    throw new ConflictError('Email is already registered.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userModel.create({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash,
    role: role || 'PLAYER',
    walletBalance: '1000.00'
  });

  return toAuthResponse(user);
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new ValidationError('Email and password are required.');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await userModel.findByEmail(normalizedEmail);

  if (!user) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const matches = await bcrypt.compare(password, user.passwordHash);

  if (!matches) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  return toAuthResponse(user);
}

async function getCurrentUser(userId) {
  const user = await userModel.findById(userId);

  if (!user) {
    throw new NotFoundError('User not found.');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    walletBalance: Number(user.walletBalance)
  };
}

module.exports = {
  signup,
  login,
  getCurrentUser
};
