const express = require('express');
const { login } = require('../services/auth.service');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const result = await login(req.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
