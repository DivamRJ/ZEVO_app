const { z } = require('zod');

const signupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['PLAYER', 'OWNER']).optional()
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

const updateProfileSchema = z.object({
  city: z.string().trim().max(120).optional().default(''),
  skillLevel: z.string().trim().min(2).max(40),
  interests: z.array(z.string().trim().min(1).max(40)).max(20).default([])
});

const walletTopupSchema = z.object({
  amount: z.coerce.number().positive().max(100000)
});

module.exports = {
  signupSchema,
  loginSchema,
  updateProfileSchema,
  walletTopupSchema
};
