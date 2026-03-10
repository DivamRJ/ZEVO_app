const authService = require('../services/auth.service');

async function signup(req, res, next) {
  try {
    const result = await authService.signup(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  signup,
  login,
  me
};
