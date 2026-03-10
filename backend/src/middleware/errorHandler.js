const { AppError } = require('../utils/errors');

function errorHandler(error, req, res, next) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({ error: 'Internal server error.' });
}

module.exports = errorHandler;
