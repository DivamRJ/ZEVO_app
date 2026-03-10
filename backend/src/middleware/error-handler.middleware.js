const { ZodError } = require('zod');
const { AppError } = require('../utils/errors');

function errorHandler(error, req, res, next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed.',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code
    });
  }

  console.error(error);
  return res.status(500).json({ error: 'Internal server error.', code: 'INTERNAL_SERVER_ERROR' });
}

module.exports = errorHandler;
