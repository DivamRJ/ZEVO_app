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

module.exports = {
  signupSchema,
  loginSchema
};
