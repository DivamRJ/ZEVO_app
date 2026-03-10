const turfService = require('../services/turf.service');

async function listTurfs(req, res, next) {
  try {
    const turfs = await turfService.listTurfs();
    return res.json({ turfs });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listTurfs
};
