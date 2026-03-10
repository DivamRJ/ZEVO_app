const app = require('../../backend/src/app');

module.exports = app;

module.exports.config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
};
