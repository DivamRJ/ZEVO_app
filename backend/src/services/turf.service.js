const turfModel = require('../models/turf.model');

function serializeTurf(turf) {
  return {
    turf_id: turf.id,
    owner_id: turf.ownerId,
    owner_name: turf.owner?.name || null,
    owner_email: turf.owner?.email || null,
    location: turf.location,
    timezone: turf.timeZone,
    price_per_hour: Number(turf.pricePerHour),
    operating_hours: turf.operatingHours
  };
}

async function listTurfs() {
  const turfs = await turfModel.listAll();
  return turfs.map(serializeTurf);
}

module.exports = {
  listTurfs
};
