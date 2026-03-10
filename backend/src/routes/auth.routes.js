const express = require('express');

const authController = require('../controllers/auth.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  signupSchema,
  loginSchema,
  updateProfileSchema,
  walletTopupSchema
} = require('../validators/auth.validator');

const router = express.Router();

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticateJwt, authController.me);
router.put('/profile', authenticateJwt, validate(updateProfileSchema), authController.updateProfile);
router.post('/wallet/topup', authenticateJwt, validate(walletTopupSchema), authController.topupWallet);

module.exports = router;
