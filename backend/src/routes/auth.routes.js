const express = require('express');

const authController = require('../controllers/auth.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { signupSchema, loginSchema } = require('../validators/auth.validator');

const router = express.Router();

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticateJwt, authController.me);

module.exports = router;
