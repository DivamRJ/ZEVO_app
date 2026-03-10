let app;

module.exports = async function handler(req, res) {
  try {
    if (!app) {
      // Lazy-load backend so boot failures return JSON instead of generic Next 500/405 wrappers.
      app = require('../../backend/src/app');
    }

    return app(req, res);
  } catch (error) {
    console.error('API bootstrap error:', error);

    return res.status(500).json({
      error: 'API bootstrap failed.',
      message: error?.message || 'Unknown server error'
    });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
};
